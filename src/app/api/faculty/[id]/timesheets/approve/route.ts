import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NotificationTriggers } from '@/lib/notification-triggers'
import { z } from 'zod'

const approveTimesheetsSchema = z.object({
  entryIds: z.array(z.string()).min(1, 'At least one entry must be selected'),
  action: z.enum(['approve', 'reject']),
  notes: z.string().optional(),
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

    // Only faculty and admin can approve timesheets
    if (session.user.role !== 'FACULTY' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: facultyId } = await params
    const body = await request.json()
    const validatedData = approveTimesheetsSchema.parse(body)

    // Verify faculty exists
    const faculty = await prisma.user.findUnique({
      where: { id: facultyId },
      include: {
        facultyProfile: true
      }
    })

    if (!faculty) {
      return NextResponse.json({ error: 'Faculty not found' }, { status: 404 })
    }

    // Verify entries belong to students assigned to this faculty
    const timesheetEntries = await prisma.timesheetEntry.findMany({
      where: {
        id: {
          in: validatedData.entryIds,
        },
        placement: {
          facultyId: facultyId,
        },
        status: 'PENDING_FACULTY',
        facultyApprovedAt: null,
      },
      include: {
        placement: {
          include: {
            student: true,
            supervisor: true
          }
        }
      }
    })

    if (timesheetEntries.length !== validatedData.entryIds.length) {
      return NextResponse.json(
        { error: 'Some entries are not valid for faculty approval' },
        { status: 400 }
      )
    }

    if (validatedData.action === 'approve') {
      // Approve the entries and update student hours
      const updatedEntries = await prisma.timesheetEntry.updateMany({
        where: {
          id: {
            in: validatedData.entryIds,
          },
        },
        data: {
          facultyApprovedAt: new Date(),
          facultyApprovedBy: session.user.id,
          status: 'APPROVED',
          notes: validatedData.notes ? 
            `${timesheetEntries[0]?.notes || ''}\n[Faculty Notes: ${validatedData.notes}]` : 
            timesheetEntries[0]?.notes,
        },
      })

      // Calculate total hours for notification
      const totalHours = timesheetEntries.reduce((sum, entry) => sum + Number(entry.hours), 0)
      const studentId = timesheetEntries[0].placement.studentId

      // Send notification to student when faculty approves
      try {
        await NotificationTriggers.timesheetFinalApproved(
          timesheetEntries[0].placement.id, // Using placement ID as timesheet ID
          studentId,
          `${faculty.firstName} ${faculty.lastName}`,
          totalHours
        )
      } catch (notificationError) {
        console.error('Failed to send final approval notification:', notificationError)
        // Don't fail the request if notification fails
      }

      return NextResponse.json({
        message: 'Timesheet entries approved successfully',
        entriesUpdated: updatedEntries.count,
        hoursAdded: totalHours,
      })
    } else {
      // Reject the entries (reset to supervisor approved state)
      const updatedEntries = await prisma.timesheetEntry.updateMany({
        where: {
          id: {
            in: validatedData.entryIds,
          },
        },
        data: {
          status: 'PENDING_FACULTY',
          facultyApprovedAt: null,
          facultyApprovedBy: null,
          notes: validatedData.notes ? 
            `${timesheetEntries[0]?.notes || ''}\n[Faculty Rejected: ${validatedData.notes}]` : 
            timesheetEntries[0]?.notes,
        },
      })

      return NextResponse.json({
        message: 'Timesheet entries rejected',
        entriesUpdated: updatedEntries.count,
      })
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Faculty approve timesheets error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
