import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, hours, facultyId, active } = body

    // Validate required fields
    if (!name || !hours) {
      return NextResponse.json(
        { error: 'Name and hours are required' },
        { status: 400 }
      )
    }

    // Check if class name already exists
    const existingClass = await prisma.class.findUnique({
      where: { name }
    })

    if (existingClass) {
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

    const newClass = await prisma.class.create({
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

    return NextResponse.json(newClass, { status: 201 })
  } catch (error) {
    console.error('Admin classes POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
