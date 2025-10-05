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

    const { id: siteId } = await params

    // Verify site exists
    const site = await prisma.site.findUnique({
      where: { id: siteId }
    })

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // Get supervisors for this site
    const supervisors = await prisma.user.findMany({
      where: {
        role: 'SUPERVISOR',
        supervisorProfile: {
          siteId: siteId
        }
      },
      include: {
        supervisorProfile: true
      },
      orderBy: {
        lastName: 'asc'
      }
    })

    return NextResponse.json(supervisors)

  } catch (error) {
    console.error('Site supervisors GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
