import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { z } from 'zod'

const createClassSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  hours: z.number().min(1, 'Hours must be at least 1'),
  facultyId: z.string().optional(),
  active: z.boolean().optional().default(true),
})

export async function GET() {
  try {
    await requireAdmin()
    
    const classes = await prisma.class.findMany({
      include: {
        faculty: {
          include: {
            facultyProfile: {
              select: {
                honorific: true
              }
            }
          }
        },
        _count: {
          select: {
            placements: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(classes)
  } catch (error) {
    console.error('Admin classes GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    
    const body = await request.json()
    const validatedData = createClassSchema.parse(body)

    // Handle empty facultyId by setting it to null
    const createData = {
      ...validatedData,
      facultyId: validatedData.facultyId && validatedData.facultyId.trim() !== '' 
        ? validatedData.facultyId 
        : null
    }

    const classData = await prisma.class.create({
      data: createData,
      include: {
        faculty: {
          include: {
            facultyProfile: {
              select: {
                honorific: true
              }
            }
          }
        },
        _count: {
          select: {
            placements: true
          }
        }
      }
    })

    return NextResponse.json(classData, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Admin classes POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}