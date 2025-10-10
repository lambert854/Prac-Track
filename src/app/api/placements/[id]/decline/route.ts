import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireFacultyOrAdmin } from '@/lib/auth-helpers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireFacultyOrAdmin()
    const { id: placementId } = await params
    const body = await request.json()
    const { notes } = body

    // Get the placement and verify faculty has access
    const placement = await prisma.placement.findUnique({
      where: { id: placementId },
      include: {
        student: true,
        site: true,
        faculty: true
      }
    })

    if (!placement) {
      return NextResponse.json(
        { error: 'Placement not found' },
        { status: 404 }
      )
    }

    // Check if faculty has access to this placement
    if (placement.facultyId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Check if placement is in pending status
    if (placement.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Placement is not in pending status' },
        { status: 400 }
      )
    }

    // Update placement status to DECLINED
    const updatedPlacement = await prisma.placement.update({
      where: { id: placementId },
      data: {
        status: 'DECLINED',
        declinedAt: new Date(),
        declinedBy: session.user.id,
        facultyNotes: notes || null
      },
      include: {
        student: {
          include: {
            studentProfile: true
          }
        },
        site: true,
        faculty: {
          include: {
            facultyProfile: true
          }
        }
      }
    })

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PLACEMENT_DECLINED',
        details: JSON.stringify({
          placementId: placementId,
          studentId: placement.studentId,
          siteId: placement.siteId,
          notes: notes || null
        })
      }
    })

    // Create notification for student
    await prisma.notification.create({
      data: {
        userId: placement.studentId,
        type: 'PLACEMENT_DECLINED',
        title: 'Placement Declined',
        message: `Your placement request at ${placement.site.name} has been declined by ${placement.faculty?.firstName} ${placement.faculty?.lastName}.`,
        data: {
          placementId: placementId,
          siteName: placement.site.name,
          facultyName: `${placement.faculty?.firstName} ${placement.faculty?.lastName}`,
          notes: notes || null
        }
      }
    })

    return NextResponse.json({
      message: 'Placement declined successfully',
      placement: updatedPlacement
    })

  } catch (error) {
    console.error('Decline placement error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
