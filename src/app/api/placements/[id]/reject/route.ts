import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const rejectPlacementSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required'),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only faculty and admin can reject placements
    if (session.user.role !== 'FACULTY' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: placementId } = await params
    const body = await request.json()
    const { reason } = rejectPlacementSchema.parse(body)

    // Verify placement exists and is in PENDING status
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

    if (placement.status !== 'PENDING') {
      return NextResponse.json({ 
        error: 'Placement is not in pending status' 
      }, { status: 400 })
    }

    // Update placement status to DECLINED
    await prisma.placement.update({
      where: { id: placementId },
      data: {
        status: 'DECLINED',
        declinedAt: new Date(),
        declinedBy: session.user.id,
        facultyNotes: reason,
      }
    })

    // TODO: Send notification to student when application is rejected
    console.log(`Placement ${placementId} rejected by ${session.user.id}. Reason: ${reason}`)

    return NextResponse.json({ 
      message: 'Placement rejected successfully',
      status: 'DECLINED'
    })

  } catch (error) {
    console.error('Placement rejection error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error',
        details: error.errors 
      }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
