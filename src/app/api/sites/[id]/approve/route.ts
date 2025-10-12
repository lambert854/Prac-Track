import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireFacultyOrAdmin } from '@/lib/auth-helpers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireFacultyOrAdmin()
    
    const { id: siteId } = await params

    const site = await prisma.site.findUnique({
      where: { id: siteId },
    })

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    if (site.status !== 'PENDING_APPROVAL') {
      return NextResponse.json({ error: 'Site is not pending approval' }, { status: 400 })
    }

    // Update site status to active and make it active
    const updatedSite = await prisma.site.update({
      where: { id: siteId },
      data: {
        status: 'ACTIVE',
        active: true,
      },
    })

    // TODO: Send notification to student that their site was approved

    return NextResponse.json({
      message: 'Site approved successfully',
      site: updatedSite,
    })

  } catch (error) {
    console.error('Site approval error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
