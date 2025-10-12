import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireFacultyOrAdmin, canAccessPlacement } from '@/lib/auth-helpers'
import { z } from 'zod'

const updatePlacementSchema = z.object({
  supervisorId: z.string().nullable().optional(),
  facultyId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'APPROVED_PENDING_CHECKLIST', 'ACTIVE', 'COMPLETE']).optional(),
  requiredHours: z.number().min(1).optional(),
  term: z.string().min(1).optional(),
  complianceChecklist: z.string().optional(),
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
      include: {
        student: {
          include: {
            studentProfile: true,
          },
        },
        site: true,
        supervisor: {
          include: {
            supervisorProfile: true,
          },
        },
        faculty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            facultyProfile: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            hours: true,
          },
        },
        pendingSupervisor: true,
      },
    })

    if (!placement) {
      return NextResponse.json({ error: 'Placement not found' }, { status: 404 })
    }

    // Check access permissions
    if (!canAccessPlacement(session.user.role, placement, session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }


    return NextResponse.json(placement)

  } catch (error) {
    console.error('Placement GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireFacultyOrAdmin()
    
    const { id } = await params
    const body = await request.json()
    const validatedData = updatePlacementSchema.parse(body)

    // Convert date strings to Date objects if provided
    const updateData: { [key: string]: unknown } = { ...validatedData }
    if (validatedData.startDate) {
      updateData.startDate = new Date(validatedData.startDate)
    }
    if (validatedData.endDate) {
      updateData.endDate = new Date(validatedData.endDate)
    }
    
    // Handle null supervisorId (removing supervisor assignment)
    if (validatedData.supervisorId === null) {
      updateData.supervisorId = null
    }

    const placement = await prisma.placement.update({
      where: { id },
      data: updateData,
      include: {
        student: {
          include: {
            studentProfile: true,
          },
        },
        site: true,
        supervisor: {
          include: {
            supervisorProfile: true,
          },
        },
        faculty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            facultyProfile: true,
          },
        },
      },
    })

    return NextResponse.json(placement)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Placement PATCH error:', error)
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
    const session = await requireFacultyOrAdmin()
    const { id: placementId } = await params

    // Check if placement exists
    const placement = await prisma.placement.findUnique({
      where: { id: placementId },
      include: {
        timesheetEntries: true,
        formSubmissions: true,
      },
    })

    if (!placement) {
      return NextResponse.json({ error: 'Placement not found' }, { status: 404 })
    }

    // Check if placement has timesheet entries or form submissions
    if (placement.timesheetEntries.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete placement with timesheet entries. Please delete timesheet entries first.' },
        { status: 400 }
      )
    }

    if (placement.formSubmissions.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete placement with form submissions. Please delete form submissions first.' },
        { status: 400 }
      )
    }

    // Delete the placement
    await prisma.placement.delete({
      where: { id: placementId },
    })

    return NextResponse.json({ message: 'Placement deleted successfully' })

  } catch (error) {
    console.error('Placement DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
