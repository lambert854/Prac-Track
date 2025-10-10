import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { z } from 'zod'

const updateClassSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  hours: z.number().min(1, 'Hours must be at least 1'),
  facultyId: z.string().optional(),
  active: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    
    const { id } = await params
    const body = await request.json()
    const validatedData = updateClassSchema.parse(body)

    console.log('Class update request:', { id, body, validatedData })

    // Handle empty facultyId by setting it to null
    const updateData = {
      ...validatedData,
      facultyId: validatedData.facultyId && validatedData.facultyId.trim() !== '' 
        ? validatedData.facultyId 
        : null
    }

    console.log('Class update data:', updateData)

    const updatedClass = await prisma.class.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(updatedClass)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Admin class PUT error:', error)
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
    await requireAdmin()
    
    const { id } = await params

    // Check if class has any placements
    const classWithPlacements = await prisma.class.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            placements: true
          }
        }
      }
    })

    if (!classWithPlacements) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }

    if (classWithPlacements._count.placements > 0) {
      return NextResponse.json(
        { error: 'Cannot delete class with active placements' },
        { status: 400 }
      )
    }

    await prisma.class.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin class DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}