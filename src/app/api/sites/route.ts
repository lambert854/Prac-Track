import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireFacultyOrAdmin } from '@/lib/auth-helpers'
import { z } from 'zod'

const createSiteSchema = z.object({
  name: z.string().min(1, 'Site name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(1, 'ZIP code is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  contactEmail: z.string().email('Valid email is required'),
  contactPhone: z.string().min(1, 'Contact phone is required'),
  practiceAreas: z.string().min(1, 'Practice areas are required'),
  active: z.boolean().optional().default(true),
  // Practicum Placement Agreement fields
  agreementStartMonth: z.number().min(1).max(12).optional(),
  agreementStartYear: z.number().min(2020).max(2030).optional(),
  agreementExpirationDate: z.string().optional(),
  staffHasActiveLicense: z.enum(['YES', 'NO']).optional(),
  supervisorTraining: z.enum(['YES', 'NO']).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || ''
    const city = searchParams.get('city') || ''
    const practice = searchParams.get('practice') || ''
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: any = {}

    // Only filter by active status if not including inactive sites
    if (!includeInactive) {
      where.active = true
      where.status = 'ACTIVE' // Only show approved sites to students
    }

    if (query) {
      where.OR = [
        { name: { contains: query } },
        { contactName: { contains: query } },
        { contactEmail: { contains: query } },
      ]
    }

    if (city) {
      where.city = { contains: city }
    }

    if (practice) {
      where.practiceAreas = { contains: practice }
    }

    const sites = await prisma.site.findMany({
      where,
      include: {
        supervisors: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        pendingSupervisors: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true
          }
        }
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(sites)

  } catch (error) {
    console.error('Sites GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireFacultyOrAdmin()
    
    const body = await request.json()
    const validatedData = createSiteSchema.parse(body)

    const site = await prisma.site.create({
      data: validatedData,
    })

    return NextResponse.json(site, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Sites POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
