import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireAdmin, requireFacultyOrAdmin } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    console.log('Admin students API: Starting request')
    
    // First, let's try a simpler approach without requireAdmin
    const session = await getServerSession(authOptions)
    console.log('Admin students API: Session obtained:', { 
      hasSession: !!session, 
      userId: session?.user?.id, 
      role: session?.user?.role 
    })
    
    if (!session) {
      console.log('Admin students API: No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN' && session.user.role !== 'FACULTY') {
      console.log('Admin students API: User is not admin or faculty:', session.user.role)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('Admin students API: Querying database...')
    
    // Get students with their placements and faculty assignments
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT'
      },
      include: {
        studentProfile: true,
        studentPlacements: {
          include: {
            site: true,
            supervisor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            faculty: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            timesheetEntries: {
              select: {
                id: true,
                date: true,
                hours: true,
                category: true,
                status: true
              }
            }
          },
          orderBy: {
            startDate: 'desc'
          }
        },
        studentFacultyAssignments: {
          include: {
            faculty: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                facultyProfile: true
              }
            }
          }
        }
      },
      orderBy: {
        firstName: 'asc'
      }
    })

    console.log('Admin students API: Found students:', students.length)
    return NextResponse.json(students)

  } catch (error) {
    console.error('Admin students GET error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireFacultyOrAdmin()
    const body = await request.json()
    const { firstName, lastName, email, password, aNumber, program, cohort, facultyId } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !aNumber || !program || !cohort || !facultyId) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    // Validate A number format
    if (!/^A[0-9]{7}$/.test(aNumber)) {
      return NextResponse.json(
        { error: 'ID Number must be in format A followed by 7 digits (e.g., A0001234)' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Check if ID Number already exists
    const existingANumber = await prisma.studentProfile.findUnique({
      where: { aNumber }
    })

    if (existingANumber) {
      return NextResponse.json(
        { error: 'ID Number already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const bcrypt = require('bcryptjs')
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user with student profile and faculty assignment
    const student = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: 'STUDENT',
        studentProfile: {
          create: {
            aNumber,
            program,
            cohort
          }
        }
      },
      include: {
        studentProfile: true
      }
    })

    // Create faculty assignment
    await prisma.facultyAssignment.create({
      data: {
        studentId: student.id,
        facultyId
      }
    })

    return NextResponse.json(student, { status: 201 })

  } catch (error) {
    console.error('Create student error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
