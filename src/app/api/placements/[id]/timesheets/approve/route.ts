import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSupervisor } from '@/lib/auth-helpers'
import { NotificationTriggers } from '@/lib/notification-triggers'
import { z } from 'zod'

const approveTimesheetsSchema = z.object({
  entryIds: z.array(z.string()).min(1, 'At least one entry must be selected'),
  action: z.enum(['approve', 'reject']),
  notes: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSupervisor()
    
    const body = await request.json()
    const validatedData = approveTimesheetsSchema.parse(body)

    const placement = await prisma.placement.findUnique({
      where: { id: params.id },
      include: {
        student: true,
        faculty: true,
        site: true
      }
    })

    if (!placement) {
      return NextResponse.json({ error: 'Placement not found' }, { status: 404 })
    }

    if (placement.supervisorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify all entries belong to this placement and are submitted
    const timesheetEntries = await prisma.timesheetEntry.findMany({
      where: {
        id: {
          in: validatedData.entryIds,
        },
        placementId: params.id,
        submittedAt: { not: null },
        approvedAt: null,
      },
    })

    if (timesheetEntries.length !== validatedData.entryIds.length) {
      return NextResponse.json(
        { error: 'Some entries are not valid for approval' },
        { status: 400 }
      )
    }

    if (validatedData.action === 'approve') {
      // Approve the entries
      const updatedEntries = await prisma.timesheetEntry.updateMany({
        where: {
          id: {
            in: validatedData.entryIds,
          },
        },
        data: {
          approvedAt: new Date(),
          approvedBy: session.user.id,
          status: 'PENDING_FACULTY',
          locked: true,
        },
      })

      // Send notification to faculty when supervisor approves
      if (placement.faculty) {
        try {
          const totalHours = timesheetEntries.reduce((sum, entry) => sum + Number(entry.hours), 0)
          
          await NotificationTriggers.timesheetSupervisorApproved(
            params.id, // Using placement ID as timesheet ID
            placement.faculty.id,
            `${placement.student.firstName} ${placement.student.lastName}`,
            `${session.user.firstName} ${session.user.lastName}`,
            totalHours
          )
        } catch (notificationError) {
          console.error('Failed to send supervisor approval notification:', notificationError)
          // Don't fail the request if notification fails
        }
      }

      return NextResponse.json({
        message: 'Timesheet entries approved successfully',
        entriesUpdated: updatedEntries.count,
      })
    } else {
      // Reject the entries (remove submittedAt to allow resubmission)
      const updatedEntries = await prisma.timesheetEntry.updateMany({
        where: {
          id: {
            in: validatedData.entryIds,
          },
        },
        data: {
          submittedAt: null,
          notes: validatedData.notes ? 
            `${timesheetEntries[0]?.notes || ''}\n[Rejected: ${validatedData.notes}]` : 
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
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Approve timesheets error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
