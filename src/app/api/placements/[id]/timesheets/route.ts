import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireStudent, canAccessPlacement } from '@/lib/auth-helpers'
import { z } from 'zod'
import { getServerSession } from 'next-auth'

const createTimesheetEntrySchema = z.object({
  date: z.string().min(1, 'Date is required'),
  hours: z.number().min(0.1, 'Hours must be greater than 0').max(24, 'Hours cannot exceed 24'),
  category: z.enum(['DIRECT', 'INDIRECT', 'TRAINING', 'ADMIN']),
  notes: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const placement = await prisma.placement.findUnique({
      where: { id },
    })

    if (!placement) {
      return NextResponse.json({ error: 'Placement not found' }, { status: 404 })
    }

    // Check access permissions
    if (!canAccessPlacement(session.user.role, placement, session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: {
      placementId: string
      date?: {
        gte: string
        lte: string
      }
    } = {
      placementId: id,
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const timesheetEntries = await prisma.timesheetEntry.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        facultyApprover: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        supervisorApprover: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        rejector: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json(timesheetEntries)

  } catch (error) {
    console.error('Timesheets GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStudent()
    
    const { searchParams } = new URL(request.url)
    const entryId = searchParams.get('entryId')
    
    if (!entryId) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 })
    }

    // Find the timesheet entry
    const timesheetEntry = await prisma.timesheetEntry.findUnique({
      where: { id: entryId },
      include: { placement: true }
    })

    if (!timesheetEntry) {
      return NextResponse.json({ error: 'Timesheet entry not found' }, { status: 404 })
    }

    // Check if the entry belongs to the student&apos;s placement
    if (timesheetEntry.placement.studentId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if the entry is locked (approved)
    if (timesheetEntry.locked) {
      return NextResponse.json(
        { error: 'Cannot delete approved timesheet entry' },
        { status: 400 }
      )
    }

    // Delete the entry
    await prisma.timesheetEntry.delete({
      where: { id: entryId }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Timesheet entry DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStudent()
    
    const body = await request.json()
    console.log('Timesheet API - Received data:', body)
    const validatedData = createTimesheetEntrySchema.parse(body)
    console.log('Timesheet API - Validated data:', validatedData)

    const { id } = await params
    const placement = await prisma.placement.findUnique({
      where: { id },
    })

    if (!placement) {
      console.log('Timesheet API - Placement not found:', id)
      return NextResponse.json({ error: 'Placement not found' }, { status: 404 })
    }

    if (placement.studentId !== session.user.id) {
      console.log('Timesheet API - Forbidden: student mismatch')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!['ACTIVE', 'APPROVED', 'APPROVED_PENDING_CHECKLIST'].includes(placement.status)) {
      console.log('Timesheet API - Placement not active:', placement.status)
      return NextResponse.json(
        { error: 'Cannot log hours for inactive placement' },
        { status: 400 }
      )
    }

    // Create new timesheet entry (allow multiple entries per day)
    const entryData = {
      placementId: id,
      date: new Date(validatedData.date),
      hours: validatedData.hours,
      category: validatedData.category,
      notes: validatedData.notes,
    }
    console.log('Timesheet API - Creating entry with data:', entryData)
    
    const timesheetEntry = await prisma.timesheetEntry.create({
      data: entryData,
      include: {
        facultyApprover: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        supervisorApprover: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        rejector: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    console.log('Timesheet API - Entry created successfully:', timesheetEntry)
    return NextResponse.json(timesheetEntry, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Timesheet entry POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
