import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only faculty and admin can access this endpoint
    if (session.user.role !== 'FACULTY' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: facultyId } = await params
    const { entryIds } = await request.json()

    if (!Array.isArray(entryIds) || entryIds.length === 0) {
      return NextResponse.json({ error: 'Invalid entry IDs' }, { status: 400 })
    }

    // Verify faculty exists
    const faculty = await prisma.user.findUnique({
      where: { id: facultyId },
    })

    if (!faculty) {
      return NextResponse.json({ error: 'Faculty not found' }, { status: 404 })
    }

    // Get the timesheets with placement information
    const timesheets = await prisma.timesheetEntry.findMany({
      where: {
        id: { in: entryIds },
        placement: {
          facultyId: facultyId,
        },
        status: 'REJECTED',
      },
      include: {
        placement: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        }
      }
    })

    if (timesheets.length === 0) {
      return NextResponse.json({ error: 'No valid rejected timesheets found' }, { status: 404 })
    }

    // Update timesheet entries to mark them as viewed by faculty
    await prisma.timesheetEntry.updateMany({
      where: {
        id: { in: entryIds },
      },
      data: {
        facultyViewedAt: new Date(),
        facultyViewedBy: facultyId,
      }
    })

    return NextResponse.json({ 
      message: 'Timesheets marked as viewed successfully',
      count: timesheets.length 
    })

  } catch (error) {
    console.error('Faculty mark viewed timesheet error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
