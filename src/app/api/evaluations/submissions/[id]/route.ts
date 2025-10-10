import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import evaluationSchema from '@/config/evaluations.schema.json'

export async function GET(
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

    // Check permissions
    const placement = submission.evaluation.placement
    const isOwner = 
      (submission.role === 'STUDENT' && session.user.id === placement.studentId) ||
      (submission.role === 'SUPERVISOR' && session.user.id === placement.supervisorId)
    const isFacultyOrAdmin = 
      session.user.role === 'FACULTY' && session.user.id === placement.facultyId ||
      session.user.role === 'ADMIN'

    if (!isOwner && !isFacultyOrAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get the appropriate title from schema
    const titleKey = submission.role === 'STUDENT' ? 'titleStudent' : 'titleSupervisor'
    const title = evaluationSchema[titleKey][submission.evaluation.type]

    // Parse answers if they exist
    const answers = submission.answers ? JSON.parse(submission.answers) : {}

    // Build response
    const response = {
      meta: {
        id: submission.id,
        type: submission.evaluation.type,
        role: submission.role,
        status: submission.status,
        lastSavedAt: submission.lastSavedAt,
        lockedAt: submission.lockedAt,
        title,
        placement: {
          id: placement.id,
          studentName: `${placement.student.firstName} ${placement.student.lastName}`,
          supervisorName: placement.supervisor 
            ? `${placement.supervisor.firstName} ${placement.supervisor.lastName}`
            : null,
          facultyName: `${placement.faculty.firstName} ${placement.faculty.lastName}`,
        },
        message: submission.role === 'STUDENT' 
          ? submission.evaluation.studentMsg 
          : submission.evaluation.supervisorMsg,
      },
      schemaPageCount: evaluationSchema.pages.length,
      answers,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Load submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
