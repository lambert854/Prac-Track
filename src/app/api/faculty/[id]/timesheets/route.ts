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
    const pendingFacultyTimesheets = await prisma.timesheetEntry.findMany({
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

    // Get timesheet entries that are pending supervisor approval for assigned students
    const pendingSupervisorTimesheets = await prisma.timesheetEntry.findMany({
      where: {
        placement: {
          facultyId: facultyId,
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
        }
      },
      orderBy: {
        submittedAt: 'desc', // Most recently submitted first
      }
    })

    console.log('Faculty timesheets API: Found', pendingFacultyTimesheets.length, 'pending faculty timesheets')
    console.log('Faculty timesheets API: Found', pendingSupervisorTimesheets.length, 'pending supervisor timesheets')

    // Group faculty timesheets by student and week for better organization
    const groupedFacultyTimesheets = pendingFacultyTimesheets.reduce((acc, entry) => {
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
          status: 'PENDING_FACULTY'
        }
      }
      
      acc[weekKey].entries.push(entry)
      acc[weekKey].totalHours += Number(entry.hours)
      
      return acc
    }, {} as Record<string, { entries: any[]; totalHours: number }>)

    // Group supervisor timesheets by student and week for better organization
    const groupedSupervisorTimesheets = pendingSupervisorTimesheets.reduce((acc, entry) => {
      const studentId = entry.placement.student.id
      const weekStart = new Date(entry.date)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Start of week
      const weekKey = `${studentId}_${weekStart.toISOString().split('T')[0]}`
      
      if (!acc[weekKey]) {
        acc[weekKey] = {
          student: entry.placement.student,
          supervisor: entry.placement.supervisor,
          site: entry.placement.site,
          weekStart: weekStart.toISOString().split('T')[0],
          weekEnd: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          entries: [],
          totalHours: 0,
          status: 'PENDING_SUPERVISOR',
          submittedAt: entry.submittedAt
        }
      }
      
      acc[weekKey].entries.push(entry)
      acc[weekKey].totalHours += Number(entry.hours)
      
      return acc
    }, {} as Record<string, { entries: any[]; totalHours: number }>)

    // Convert to arrays and sort appropriately
    const facultyTimesheetGroups = Object.values(groupedFacultyTimesheets).sort((a: any, b: any) => 
      new Date(b.supervisorApprovedAt).getTime() - new Date(a.supervisorApprovedAt).getTime()
    )

    const supervisorTimesheetGroups = Object.values(groupedSupervisorTimesheets).sort((a: any, b: any) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    )

    console.log('Faculty timesheets API: Returning', facultyTimesheetGroups.length, 'faculty timesheet groups')
    console.log('Faculty timesheets API: Returning', supervisorTimesheetGroups.length, 'supervisor timesheet groups')

    return NextResponse.json({
      facultyTimesheets: facultyTimesheetGroups,
      supervisorTimesheets: supervisorTimesheetGroups,
      totalPendingFaculty: pendingFacultyTimesheets.length,
      totalPendingSupervisor: pendingSupervisorTimesheets.length,
    })

  } catch (error) {
    console.error('Faculty timesheets GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
