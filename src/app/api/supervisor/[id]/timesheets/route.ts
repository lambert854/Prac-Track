import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('Supervisor timesheets API: Starting request')
    
    const session = await getServerSession(authOptions)
    
    if (!session) {
      console.log('Supervisor timesheets API: No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Supervisor timesheets API: Session found for user:', session.user.id, 'role:', session.user.role)

    // Only supervisors can access this endpoint
    if (session.user.role !== 'SUPERVISOR') {
      console.log('Supervisor timesheets API: Access denied for role:', session.user.role)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: supervisorId } = await params
    console.log('Supervisor timesheets API: Fetching timesheets for supervisor:', supervisorId)

    // Verify supervisor exists
    const supervisor = await prisma.user.findUnique({
      where: { id: supervisorId },
    })

    if (!supervisor) {
      console.log('Supervisor timesheets API: Supervisor not found:', supervisorId)
      return NextResponse.json({ error: 'Supervisor not found' }, { status: 404 })
    }

    console.log('Supervisor timesheets API: Supervisor found:', supervisor.firstName, supervisor.lastName)

    // Get timesheet entries that are pending supervisor approval
    console.log('Supervisor timesheets API: Querying database...')
    const pendingTimesheets = await prisma.timesheetEntry.findMany({
      where: {
        placement: {
          supervisorId: supervisorId,
        },
        status: 'PENDING_SUPERVISOR',
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
            },
            site: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc', // Most recent first
      }
    })

    console.log('Supervisor timesheets API: Found', pendingTimesheets.length, 'pending timesheets')

    // Group timesheets by student and week for better organization
    const groupedTimesheets = pendingTimesheets.reduce((acc, entry) => {
      const studentId = entry.placement.student.id
      const weekStart = new Date(entry.date)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Start of week
      const weekKey = `${studentId}_${weekStart.toISOString().split('T')[0]}`
      
      if (!acc[weekKey]) {
        acc[weekKey] = {
          student: entry.placement.student,
          site: entry.placement.site,
          weekStart: weekStart.toISOString().split('T')[0],
          weekEnd: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          entries: [],
          totalHours: 0,
        }
      }
      
      acc[weekKey].entries.push(entry)
      acc[weekKey].totalHours += Number(entry.hours)
      
      return acc
    }, {} as Record<string, any>)

    // Convert to array and sort by week start date
    const timesheetGroups = Object.values(groupedTimesheets).sort((a: { [key: string]: unknown }, b: { [key: string]: unknown }) => 
      new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
    )

    console.log('Supervisor timesheets API: Returning', timesheetGroups.length, 'timesheet groups')

    return NextResponse.json({
      timesheets: timesheetGroups,
      totalPending: pendingTimesheets.length,
    })

  } catch (error) {
    console.error('Supervisor timesheets GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
