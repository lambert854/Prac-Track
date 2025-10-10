import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('Supervisor students API: Starting request')
    
    const session = await getServerSession(authOptions)
    
    if (!session) {
      console.log('Supervisor students API: No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Supervisor students API: Session found for user:', session.user.id, 'role:', session.user.role)

    // Only supervisors can access this endpoint
    if (session.user.role !== 'SUPERVISOR') {
      console.log('Supervisor students API: Access denied for role:', session.user.role)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: supervisorId } = await params
    console.log('Supervisor students API: Fetching students for supervisor:', supervisorId)

    // Validate supervisor ID format
    if (!supervisorId || supervisorId.length < 10) {
      console.log('Supervisor students API: Invalid supervisor ID format:', supervisorId)
      return NextResponse.json({ error: 'Invalid supervisor ID' }, { status: 400 })
    }

    // Verify supervisor exists
    const supervisor = await prisma.user.findUnique({
      where: { id: supervisorId },
    })

    if (!supervisor) {
      console.log('Supervisor students API: Supervisor not found:', supervisorId)
      return NextResponse.json({ error: 'Supervisor not found' }, { status: 404 })
    }

    console.log('Supervisor students API: Supervisor found:', supervisor.firstName, supervisor.lastName)
    console.log('Supervisor students API: Supervisor role:', supervisor.role)

    // Get students assigned to this supervisor through placements
    console.log('Supervisor students API: Querying database...')
    
    // Test database connection first
    try {
      const testQuery = await prisma.placement.count()
      console.log('Supervisor students API: Database connection test successful, total placements:', testQuery)
    } catch (testError) {
      console.error('Supervisor students API: Database connection test failed:', testError)
      return NextResponse.json(
        { error: 'Database connection failed', details: testError instanceof Error ? testError.message : 'Unknown error' },
        { status: 500 }
      )
    }
    
    let assignedStudents = []
    let timesheetEntries = []
    
    try {
      // Get placements assigned to this supervisor
      assignedStudents = await prisma.placement.findMany({
        where: {
          supervisorId: supervisorId,
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              active: true,
            }
          },
          site: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              state: true,
              zip: true,
            }
          },
          faculty: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              facultyProfile: {
                select: {
                  honorific: true,
                }
              }
            }
          }
        },
        orderBy: {
          startDate: 'desc',
        }
      })

      console.log('Supervisor students API: Found placements:', assignedStudents.length)

      // Get timesheet entries for these placements
      timesheetEntries = await prisma.timesheetEntry.findMany({
        where: {
          placement: {
            supervisorId: supervisorId,
          }
        },
        select: {
          id: true,
          placementId: true,
          date: true,
          hours: true,
          status: true,
        },
        orderBy: {
          date: 'desc',
        }
      })

      console.log('Supervisor students API: Found timesheet entries:', timesheetEntries.length)
      
    } catch (dbError) {
      console.error('Supervisor students API: Database error:', dbError)
      return NextResponse.json(
        { error: 'Database query failed', details: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500 }
      )
    }

    // Process the data to include summary information
    let studentsWithSummary = []
    
    try {
      studentsWithSummary = assignedStudents.map(placement => {
        // Get timesheet entries for this specific placement
        const placementTimesheets = timesheetEntries.filter(entry => entry.placementId === placement.id)
        
        // Calculate total hours from all timesheet entries
        const totalHours = placementTimesheets.reduce((sum, entry) => {
          return sum + (entry.status === 'APPROVED' ? Number(entry.hours) : 0)
        }, 0)

        // Get pending timesheets count
        const pendingTimesheets = placementTimesheets.filter(entry => 
          entry.status === 'PENDING_SUPERVISOR'
        ).length

        // Get recent activity (last timesheet entry)
        const lastActivity = placementTimesheets.length > 0 
          ? placementTimesheets[0].date 
          : null

        return {
          placementId: placement.id,
          student: placement.student,
          site: placement.site,
          faculty: placement.faculty,
          status: placement.status,
          startDate: placement.startDate,
          endDate: placement.endDate,
          requiredHours: placement.requiredHours,
          totalHours,
          pendingTimesheets,
          lastActivity,
          recentTimesheets: placementTimesheets.slice(0, 5), // Last 5 entries for summary
        }
      })
    } catch (processingError) {
      console.error('Supervisor students API: Data processing error:', processingError)
      return NextResponse.json(
        { error: 'Data processing failed', details: processingError instanceof Error ? processingError.message : 'Unknown error' },
        { status: 500 }
      )
    }

    console.log('Supervisor students API: Returning', studentsWithSummary.length, 'students with summary')

    return NextResponse.json({
      students: studentsWithSummary,
      totalStudents: assignedStudents.length,
    })

  } catch (error) {
    console.error('Supervisor students GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
