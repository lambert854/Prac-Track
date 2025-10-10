import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const saveSubmissionSchema = z.object({
  answers: z.record(z.union([z.number(), z.string()])),
  pageId: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: submissionId } = await params
    const body = await request.json()
    const validatedData = saveSubmissionSchema.parse(body)

    // Fetch the submission with related data
    const submission = await prisma.evaluationSubmission.findUnique({
      where: { id: submissionId },
      include: {
        evaluation: {
          include: {
            placement: true,
          },
        },
      },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Check if submission is locked
    if (submission.status === 'LOCKED') {
      return NextResponse.json(
        { error: 'Cannot save: submission is locked' },
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

    // Merge existing answers with new answers
    const existingAnswers = submission.answers ? JSON.parse(submission.answers) : {}
    const mergedAnswers = {
      ...existingAnswers,
      ...validatedData.answers,
    }

    // Update submission
    const updatedSubmission = await prisma.evaluationSubmission.update({
      where: { id: submissionId },
      data: {
        answers: JSON.stringify(mergedAnswers),
        status: 'IN_PROGRESS',
        lastSavedAt: new Date(),
        submittedById: session.user.id, // Track who is working on it
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'EVALUATION_SAVED',
        details: JSON.stringify({
          evaluationId: submission.evaluationId,
          submissionId: submission.id,
          placementId: placement.id,
          type: submission.evaluation.type,
          role: submission.role,
          pageId: validatedData.pageId,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      },
    })

    return NextResponse.json({
      success: true,
      lastSavedAt: updatedSubmission.lastSavedAt,
    })
  } catch (error) {
    console.error('Save submission error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
