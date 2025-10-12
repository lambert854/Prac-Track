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

    // Only faculty and admin can activate placements
    if (session.user.role !== 'FACULTY' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: placementId } = await params

    // Verify placement exists and is in APPROVED_PENDING_CHECKLIST status
    const placement = await prisma.placement.findUnique({
      where: { id: placementId },
      include: {
        student: true,
        faculty: true
      }
    })

    if (!placement) {
      return NextResponse.json({ error: 'Placement not found' }, { status: 404 })
    }

    if (placement.status !== 'APPROVED_PENDING_CHECKLIST') {
      return NextResponse.json({ 
        error: 'Placement is not in checklist phase' 
      }, { status: 400 })
    }

    // Checklist is no longer required for activation - it&apos;s due Week 2

    // Update placement status to ACTIVE
    await prisma.placement.update({
      where: { id: placementId },
      data: {
        status: 'ACTIVE',
        approvedAt: new Date(), // Update approval timestamp
        approvedBy: session.user.id,
      }
    })

    // TODO: Send notification to student when placement is activated
    console.log(`Placement ${placementId} activated by ${session.user.id}`)

    return NextResponse.json({ 
      message: 'Placement activated successfully',
      status: 'ACTIVE'
    })

  } catch (error) {
    console.error('Placement activation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
