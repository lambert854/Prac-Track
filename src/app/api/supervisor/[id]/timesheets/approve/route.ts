import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NotificationTriggers } from '@/lib/notification-triggers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only supervisors can access this endpoint
    if (session.user.role !== 'SUPERVISOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: supervisorId } = await params
    const { timesheetIds, action } = await request.json() // 'approve' or 'reject'

    if (!Array.isArray(timesheetIds) || timesheetIds.length === 0) {
      return NextResponse.json({ error: 'Invalid timesheet IDs' }, { status: 400 })
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Verify supervisor exists and is assigned to these timesheets
    const supervisor = await prisma.user.findUnique({
      where: { id: supervisorId },
    })

    if (!supervisor) {
      return NextResponse.json({ error: 'Supervisor not found' }, { status: 404 })
    }

    // Get the timesheets with placement and student information
    const timesheets = await prisma.timesheetEntry.findMany({
      where: {
        id: { in: timesheetIds },
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
            faculty: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            },
            site: {
              select: {
                name: true,
              }
            }
          }
        }
      }
    })

    if (timesheets.length === 0) {
      return NextResponse.json({ error: 'No valid timesheets found' }, { status: 404 })
    }

    // Update timesheet entries
    const updateData = action === 'approve' 
      ? { 
          status: 'PENDING_FACULTY' as const,
          supervisorApprovedBy: supervisorId,
          supervisorApprovedAt: new Date(),
        }
      : { 
          status: 'REJECTED' as const,
          rejectedBy: supervisorId,
          rejectedAt: new Date(),
        }

    await prisma.timesheetEntry.updateMany({
      where: {
        id: { in: timesheetIds },
      },
      data: updateData
    })

    // Send notifications
    if (action === 'approve') {
      // Group by student for notifications
      const studentGroups = timesheets.reduce((acc, entry) => {
        const studentId = entry.placement.student.id
        if (!acc[studentId]) {
          acc[studentId] = {
            student: entry.placement.student,
            faculty: entry.placement.faculty,
            site: entry.placement.site,
            entries: []
          }
        }
        acc[studentId].entries.push(entry)
        return acc
      }, {} as Record<string, any>)

      // Send notification to faculty for each student
      for (const group of Object.values(studentGroups)) {
        if (group.faculty) {
          const totalHours = group.entries.reduce((sum: number, entry: { [key: string]: unknown }) => sum + Number(entry.hours), 0)
          const studentName = `${group.student.firstName} ${group.student.lastName}`
          
          await NotificationTriggers.timesheetSupervisorApproved(
            group.entries[0]?.id || 'unknown', // timesheetId
            group.faculty.id,
            studentName,
            session.user.name || 'Supervisor',
            totalHours
          )
        }
      }
    }

    return NextResponse.json({ 
      message: `Timesheets ${action}d successfully`,
      count: timesheets.length 
    })

  } catch (error) {
    console.error('Supervisor timesheet approval error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
