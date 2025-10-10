import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: placementId } = await params
    const searchParams = request.nextUrl.searchParams
    const role = searchParams.get('role') as 'STUDENT' | 'SUPERVISOR' | null

    // Fetch the placement to verify access
    const placement = await prisma.placement.findUnique({
      where: { id: placementId },
      include: {
        evaluations: {
          include: {
            submissions: {
              where: role ? { role } : {},
            },
          },
        },
      },
    })

    if (!placement) {
      return NextResponse.json({ error: 'Placement not found' }, { status: 404 })
    }

    // Check permissions - faculty/admin can view, or the student/supervisor themselves
    const isFacultyOrAdmin = 
      session.user.role === 'FACULTY' && session.user.id === placement.facultyId ||
      session.user.role === 'ADMIN'
    const isStudent = session.user.id === placement.studentId
    const isSupervisor = session.user.id === placement.supervisorId

    if (!isFacultyOrAdmin && !isStudent && !isSupervisor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Format the response
    const submissions = placement.evaluations.flatMap(evaluation => 
      evaluation.submissions.map(submission => ({
        id: submission.id,
        evaluationId: evaluation.id,
        type: evaluation.type,
        role: submission.role,
        status: submission.status,
        lastSavedAt: submission.lastSavedAt,
        lockedAt: submission.lockedAt,
      }))
    )

    return NextResponse.json(submissions)
  } catch (error) {
    console.error('Get evaluations error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
