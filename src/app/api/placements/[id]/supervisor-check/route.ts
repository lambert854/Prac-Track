import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canAccessPlacement } from '@/lib/auth-helpers'

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

    // Get placement details
    const placement = await prisma.placement.findUnique({
      where: { id: placementId },
      include: {
        student: true,
        supervisor: true,
        faculty: true,
        site: true
      }
    })

    if (!placement) {
      return NextResponse.json({ error: 'Placement not found' }, { status: 404 })
    }

    // Check if user can access this placement
    if (!canAccessPlacement(session.user.role, placement, session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      hasSupervisor: !!placement.supervisorId,
      supervisor: placement.supervisor,
      placement: {
        id: placement.id,
        status: placement.status,
        studentId: placement.studentId,
        facultyId: placement.facultyId,
        supervisorId: placement.supervisorId
      }
    })

  } catch (error) {
    console.error('Supervisor check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
