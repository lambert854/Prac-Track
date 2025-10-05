import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireFacultyOrAdmin } from '@/lib/auth-helpers'
import { z } from 'zod'

const updateSiteSchema = z.object({
  name: z.string().min(1, 'Site name is required').optional(),
  address: z.string().min(1, 'Address is required').optional(),
  city: z.string().min(1, 'City is required').optional(),
  state: z.string().min(1, 'State is required').optional(),
  zip: z.string().min(1, 'ZIP code is required').optional(),
  contactName: z.string().min(1, 'Contact name is required').optional(),
  contactEmail: z.string().email('Valid email is required').optional(),
  contactPhone: z.string().min(1, 'Contact phone is required').optional(),
  practiceAreas: z.string().min(1, 'Practice areas are required').optional(),
  active: z.boolean().optional(),
  // Field Placement Agreement fields
  agreementStartMonth: z.number().min(1).max(12).optional(),
  agreementStartYear: z.number().min(2020).max(2030).optional(),
  agreementExpirationDate: z.string().optional(),
  staffHasActiveLicense: z.enum(['YES', 'NO']).optional(),
  supervisorTraining: z.enum(['YES', 'NO']).optional(),
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
    const site = await prisma.site.findUnique({
      where: { id },
      include: {
        supervisors: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        },
        placements: {
          include: {
            student: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          },
          orderBy: {
            startDate: 'desc'
          }
        }
      }
    })

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    return NextResponse.json(site)

  } catch (error) {
    console.error('Site GET error:', error)
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
    
    console.log('PATCH site request:', { id, body })
    
    const validatedData = updateSiteSchema.parse(body)
    
    console.log('Validated data:', validatedData)

    const site = await prisma.site.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json(site)

  } catch (error) {
    console.error('Site PATCH error:', error)
    
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors)
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireFacultyOrAdmin()
    
    // Check if this is a hard delete (admin only) or soft delete
    const url = new URL(request.url)
    const hardDelete = url.searchParams.get('hard') === 'true'
    
    if (hardDelete && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only administrators can permanently delete sites' },
        { status: 403 }
      )
    }
    
    if (hardDelete) {
      // Hard delete for admin cleanup of dummy/test data
      // This will cascade delete related records
      await prisma.site.delete({
        where: { id: params.id },
      })
      
      return NextResponse.json({ message: 'Site permanently deleted successfully' })
    } else {
      // Soft delete by setting active to false
      const site = await prisma.site.update({
        where: { id: params.id },
        data: { active: false },
      })

      return NextResponse.json({ message: 'Site deactivated successfully' })
    }

  } catch (error) {
    console.error('Site DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
