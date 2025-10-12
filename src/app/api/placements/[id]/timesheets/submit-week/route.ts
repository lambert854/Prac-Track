import { requireStudent } from '@/lib/auth-helpers'
import { NotificationTriggers } from '@/lib/notification-triggers'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const submitWeekSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStudent()
    
    const body = await request.json()
    const validatedData = submitWeekSchema.parse(body)
    const { id } = await params

    const placement = await prisma.placement.findUnique({
      where: { id },
      include: {
        student: true,
        supervisor: true,
        site: true
      }
    })

    if (!placement) {
      return NextResponse.json({ error: 'Placement not found' }, { status: 404 })
    }

    if (placement.studentId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!['ACTIVE', 'APPROVED', 'APPROVED_PENDING_CHECKLIST'].includes(placement.status)) {
      return NextResponse.json(
        { error: 'Cannot submit timesheets for inactive placement' },
        { status: 400 }
      )
    }

    const startDate = new Date(validatedData.startDate)
    const endDate = new Date(validatedData.endDate)

    // Find all timesheet entries for this week that are not already submitted
    const timesheetEntries = await prisma.timesheetEntry.findMany({
      where: {
        placementId: id,
        date: {
          gte: startDate,
          lte: endDate,
        },
        submittedAt: null,
      },
    })

    if (timesheetEntries.length === 0) {
      return NextResponse.json(
        { error: 'No timesheet entries found for this week' },
        { status: 400 }
      )
    }

    // Update all entries to mark them as submitted and change status
    const updatedEntries = await prisma.timesheetEntry.updateMany({
      where: {
        id: {
          in: timesheetEntries.map(entry => entry.id),
        },
      },
      data: {
        submittedAt: new Date(),
        status: 'PENDING_SUPERVISOR',
      },
    })

    // Send notification to supervisor if they exist
    if (placement.supervisor) {
      try {
        const totalHours = timesheetEntries.reduce((sum, entry) => sum + Number(entry.hours), 0)
        const weekRange = `${validatedData.startDate} - ${validatedData.endDate}`
        
        await NotificationTriggers.timesheetSubmitted(
          placement.id, // Using placement ID as timesheet ID for now
          placement.supervisor.id,
          `${placement.student.firstName} ${placement.student.lastName}`,
          placement.site.name,
          weekRange,
          totalHours,
          timesheetEntries.length
        )
      } catch (notificationError) {
        console.error('Failed to send timesheet submission notification:', notificationError)
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json({
      message: 'Week submitted successfully',
      entriesUpdated: updatedEntries.count,
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Submit week error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
