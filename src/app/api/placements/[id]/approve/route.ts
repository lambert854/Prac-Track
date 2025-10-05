import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NotificationTriggers } from '@/lib/notification-triggers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only faculty and admin can approve placements
    if (session.user.role !== 'FACULTY' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: placementId } = await params

    // Verify placement exists and is in PENDING status
    const placement = await prisma.placement.findUnique({
      where: { id: placementId },
      include: {
        student: true,
        faculty: true,
        site: true
      }
    })

    if (!placement) {
      return NextResponse.json({ error: 'Placement not found' }, { status: 404 })
    }

    if (placement.status !== 'PENDING') {
      return NextResponse.json({ 
        error: 'Placement is not in pending status' 
      }, { status: 400 })
    }

    // Check if required documents are uploaded
    if (!placement.cellPolicy) {
      return NextResponse.json({ 
        error: 'Cannot approve: cell phone usage policy is required' 
      }, { status: 400 })
    }

    // Update placement status to APPROVED_PENDING_CHECKLIST
    await prisma.placement.update({
      where: { id: placementId },
      data: {
        status: 'APPROVED_PENDING_CHECKLIST',
        approvedAt: new Date(),
        approvedBy: session.user.id,
      }
    })

    // Send notification to student when application is approved
    try {
      await NotificationTriggers.placementApproved(
        placementId,
        placement.student.id,
        placement.site.name
      )
    } catch (notificationError) {
      console.error('Failed to send placement approval notification:', notificationError)
      // Don't fail the request if notification fails
    }

    return NextResponse.json({ 
      message: 'Placement approved successfully',
      status: 'APPROVED_PENDING_CHECKLIST'
    })

  } catch (error) {
    console.error('Placement approval error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}