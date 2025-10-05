import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireFacultyOrAdmin, requireAdmin } from '@/lib/auth-helpers'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const session = await requireFacultyOrAdmin()

    // Get all faculty members with their assignments and placements
    const faculty = await prisma.user.findMany({
      where: {
        role: 'FACULTY'
      },
      include: {
        facultyProfile: true,
        facultyStudentAssignments: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                studentProfile: {
                  select: {
                    aNumber: true,
                    program: true,
                    cohort: true
                  }
                }
              }
            }
          }
        },
        facultyPlacements: {
          include: {
            student: {
              select: {
                firstName: true,
                lastName: true
              }
            },
            site: {
              select: {
                name: true
              }
            }
          }
        },
      },
      orderBy: {
        lastName: 'asc'
      }
    })

    return NextResponse.json(faculty)

  } catch (error) {
    console.error('Faculty GET error:', error)
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
    const { honorific, firstName, lastName, email, password, title, officePhone, roomNumber } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create faculty user
    const faculty = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone: null,
        role: 'FACULTY',
        facultyProfile: {
          create: {
            honorific: honorific || null,
            title: title || null,
            officePhone: officePhone || null,
            roomNumber: roomNumber || null
          }
        }
      },
      include: {
        facultyProfile: true
      }
    })

    return NextResponse.json(faculty, { status: 201 })

  } catch (error) {
    console.error('Create faculty error:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      if (error.message === 'Insufficient permissions') {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
