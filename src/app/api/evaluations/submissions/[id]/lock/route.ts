import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import evaluationSchema from '@/config/evaluations.schema.json'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: submissionId } = await params

    // Fetch the submission with related data
    const submission = await prisma.evaluationSubmission.findUnique({
      where: { id: submissionId },
      include: {
        evaluation: {
          include: {
            placement: {
              include: {
                student: true,
                supervisor: true,
                faculty: true,
              },
            },
          },
        },
      },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Check if already locked
    if (submission.status === 'LOCKED') {
      return NextResponse.json(
        { error: 'Submission is already locked' },
        { status: 400 }
      )
    }

    // Check permissions
    const placement = submission.evaluation.placement
    const isOwner = 
      (submission.role === 'STUDENT' && session.user.id === placement.studentId) ||
      (submission.role === 'SUPERVISOR' && session.user.id === placement.supervisorId)

    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse answers
    const answers = submission.answers ? JSON.parse(submission.answers) : {}

    // Validate all required fields across all pages
    const missingFields: string[] = []
    
    for (const page of evaluationSchema.pages) {
      for (const field of page.fields) {
        if (field.required) {
          const value = answers[field.id]
          
          // Check if value exists and is not empty
          if (value === undefined || value === null || value === '') {
            missingFields.push(`${page.title}: ${field.label}`)
          }
          
          // For "Not Applicable" (value 9), accept it as valid
          if (field.type === 'single-select' && value === 9) {
            // N/A is acceptable
            continue
          }
        }
      }
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot submit: required fields are missing',
          missingFields,
        },
        { status: 400 }
      )
    }

    // Lock the submission
    const updatedSubmission = await prisma.evaluationSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'LOCKED',
        lockedAt: new Date(),
        submittedById: session.user.id,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'EVALUATION_SUBMITTED',
        details: JSON.stringify({
          evaluationId: submission.evaluationId,
          submissionId: submission.id,
          placementId: placement.id,
          type: submission.evaluation.type,
          role: submission.role,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      },
    })

    // Create notification for the submitter (confirmation)
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: 'EVALUATION_SUBMITTED',
        title: `${submission.evaluation.type === 'MIDTERM' ? 'Mid-Term' : 'Final'} Evaluation Submitted`,
        message: submission.role === 'STUDENT' 
          ? 'Your self-evaluation has been submitted successfully.'
          : 'Your evaluation has been submitted successfully.',
        relatedEntityId: submission.evaluationId,
        relatedEntityType: 'EVALUATION',
        priority: 'LOW',
      },
    })

    // Notify faculty that an evaluation was submitted
    if (placement.facultyId) {
      await prisma.notification.create({
        data: {
          userId: placement.facultyId,
          type: 'EVALUATION_SUBMITTED',
          title: `${submission.evaluation.type === 'MIDTERM' ? 'Mid-Term' : 'Final'} Evaluation Completed`,
          message: submission.role === 'STUDENT'
            ? `${placement.student.firstName} ${placement.student.lastName} has completed their self-evaluation.`
            : `${placement.supervisor?.firstName} ${placement.supervisor?.lastName} has completed their evaluation of ${placement.student.firstName} ${placement.student.lastName}.`,
          relatedEntityId: submission.evaluationId,
          relatedEntityType: 'EVALUATION',
          priority: 'MEDIUM',
        },
      })
    }

    return NextResponse.json({
      success: true,
      lockedAt: updatedSubmission.lockedAt,
    })
  } catch (error) {
    console.error('Lock submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
