import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can unlock evaluations
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const { id: submissionId } = await params

    // Fetch the submission
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

    if (submission.status !== 'LOCKED') {
      return NextResponse.json(
        { error: 'Submission is not locked' },
        { status: 400 }
      )
    }

    // Unlock the submission
    const updatedSubmission = await prisma.evaluationSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'IN_PROGRESS',
        lockedAt: null,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'EVALUATION_UNLOCKED',
        details: JSON.stringify({
          evaluationId: submission.evaluationId,
          submissionId: submission.id,
          placementId: submission.evaluation.placementId,
          type: submission.evaluation.type,
          role: submission.role,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Submission unlocked successfully',
    })
  } catch (error) {
    console.error('Unlock submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
