import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('Faculty timesheets API: Starting request')
    
    const session = await getServerSession(authOptions)
    
    if (!session) {
      console.log('Faculty timesheets API: No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Faculty timesheets API: Session found for user:', session.user.id, 'role:', session.user.role)

    // Only faculty and admin can access this endpoint
    if (session.user.role !== 'FACULTY' && session.user.role !== 'ADMIN') {
      console.log('Faculty timesheets API: Access denied for role:', session.user.role)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: facultyId } = await params
    console.log('Faculty timesheets API: Fetching timesheets for faculty:', facultyId)

    // Verify faculty exists
    const faculty = await prisma.user.findUnique({
      where: { id: facultyId },
    })

    if (!faculty) {
      console.log('Faculty timesheets API: Faculty not found:', facultyId)
      return NextResponse.json({ error: 'Faculty not found' }, { status: 404 })
    }

    console.log('Faculty timesheets API: Faculty found:', faculty.firstName, faculty.lastName)

    // Get timesheet entries that are pending faculty approval
    console.log('Faculty timesheets API: Querying database...')
    const pendingTimesheets = await prisma.timesheetEntry.findMany({
      where: {
        placement: {
          facultyId: facultyId,
        },
        status: 'PENDING_FACULTY',
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
            supervisor: {
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
        },
        supervisorApprover: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: {
        supervisorApprovedAt: 'desc', // Most recently supervisor-approved first
      }
    })

    console.log('Faculty timesheets API: Found', pendingTimesheets.length, 'pending timesheets')

    // Group timesheets by student and week for better organization
    const groupedTimesheets = pendingTimesheets.reduce((acc, entry) => {
      const studentId = entry.placement.student.id
      const weekStart = new Date(entry.date)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Start of week
      const weekKey = `${studentId}_${weekStart.toISOString().split('T')[0]}`
      
      if (!acc[weekKey]) {
        acc[weekKey] = {
          student: entry.placement.student,
          supervisor: entry.placement.supervisor,
          site: entry.placement.site,
          supervisorApprovedBy: entry.supervisorApprover,
          supervisorApprovedAt: entry.supervisorApprovedAt,
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

    // Convert to array and sort by supervisor approval date
    const timesheetGroups = Object.values(groupedTimesheets).sort((a: any, b: any) => 
      new Date(b.supervisorApprovedAt).getTime() - new Date(a.supervisorApprovedAt).getTime()
    )

    console.log('Faculty timesheets API: Returning', timesheetGroups.length, 'timesheet groups')

    return NextResponse.json({
      timesheets: timesheetGroups,
      totalPending: pendingTimesheets.length,
    })

  } catch (error) {
    console.error('Faculty timesheets GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
