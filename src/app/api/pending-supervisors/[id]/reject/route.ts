import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireFacultyOrAdmin } from '@/lib/auth-helpers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireFacultyOrAdmin()

    const { id } = await params
    const { reason } = await request.json()

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      )
    }

    // Get the pending supervisor
    const pendingSupervisor = await prisma.pendingSupervisor.findUnique({
      where: { id },
      include: {
        placement: {
          include: {
            student: true,
            site: true,
          },
        },
      },
    })

    if (!pendingSupervisor) {
      return NextResponse.json(
        { error: 'Pending supervisor not found' },
        { status: 404 }
      )
    }

    if (pendingSupervisor.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Supervisor has already been processed' },
        { status: 400 }
      )
    }

    // Update the pending supervisor status
    await prisma.pendingSupervisor.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedAt: new Date(),
        approvedBy: (await getServerSession(authOptions))?.user?.id,
        // Note: We could add a rejectionReason field to the schema if needed
      },
    })

    // TODO: Send notification to student about supervisor rejection
    console.log(`Supervisor rejected: ${pendingSupervisor.email}, reason: ${reason}`)

    return NextResponse.json({
      message: 'Supervisor rejected successfully',
    })

  } catch (error) {
    console.error('Pending supervisor rejection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
