import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireFacultyOrAdmin } from '@/lib/auth-helpers'
import { z } from 'zod'

const rejectSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required'),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireFacultyOrAdmin()
    
    const { id: siteId } = await params
    const body = await request.json()
    const validatedData = rejectSchema.parse(body)

    const site = await prisma.site.findUnique({
      where: { id: siteId },
    })

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    if (site.status !== 'PENDING_APPROVAL') {
      return NextResponse.json({ error: 'Site is not pending approval' }, { status: 400 })
    }

    // Update site status to rejected
    const updatedSite = await prisma.site.update({
      where: { id: siteId },
      data: {
        status: 'REJECTED',
        active: false,
      },
    })

    // TODO: Send notification to student that their site was rejected with reason

    return NextResponse.json({
      message: 'Site rejected successfully',
      site: updatedSite,
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Site rejection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
