import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, hours, facultyId, active } = body

    // Validate required fields
    if (!name || !hours) {
      return NextResponse.json(
        { error: 'Name and hours are required' },
        { status: 400 }
      )
    }

    // Check if class exists
    const existingClass = await prisma.class.findUnique({
      where: { id }
    })

    if (!existingClass) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }

    // Check if class name already exists (excluding current class)
    const duplicateClass = await prisma.class.findFirst({
      where: { 
        name,
        id: { not: id }
      }
    })

    if (duplicateClass) {
      return NextResponse.json(
        { error: 'A class with this name already exists' },
        { status: 400 }
      )
    }

    // Validate faculty if provided
    if (facultyId) {
      const faculty = await prisma.user.findUnique({
        where: { 
          id: facultyId,
          role: UserRole.FACULTY
        }
      })

      if (!faculty) {
        return NextResponse.json(
          { error: 'Invalid faculty member' },
          { status: 400 }
        )
      }
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        name,
        hours: parseInt(hours),
        facultyId: facultyId || null,
        active: active !== false
      },
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
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if class exists
    const existingClass = await prisma.class.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            placements: true
          }
        }
      }
    })

    if (!existingClass) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }

    // Check if class has active placements
    if (existingClass._count.placements > 0) {
      return NextResponse.json(
        { error: 'Cannot delete class with active placements' },
        { status: 400 }
      )
    }

    await prisma.class.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Class deleted successfully' })
  } catch (error) {
    console.error('Admin class DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
