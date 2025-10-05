import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireFacultyOrAdmin } from '@/lib/auth-helpers'
import bcrypt from 'bcryptjs'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireFacultyOrAdmin()
    const { id: studentId } = await params
    const body = await request.json()
    const { firstName, lastName, email, aNumber, program, cohort, password, active } = body

    // If updating active status only, skip other validations
    const isActiveStatusUpdate = active !== undefined && !firstName && !lastName && !email && !aNumber && !program && !cohort

    // Validate required fields (unless it's just an active status update)
    if (!isActiveStatusUpdate && (!firstName || !lastName || !email || !aNumber || !program || !cohort)) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    // Validate A number format (unless it's just an active status update)
    if (!isActiveStatusUpdate && aNumber && !/^A[0-9]{7}$/.test(aNumber)) {
      return NextResponse.json(
        { error: 'A number must be in format A followed by 7 digits (e.g., A0001234)' },
        { status: 400 }
      )
    }

    // Check if student exists
    const existingStudent = await prisma.user.findUnique({
      where: { id: studentId, role: 'STUDENT' },
      include: { studentProfile: true }
    })

    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Check if email already exists for another user (unless it's just an active status update)
    if (!isActiveStatusUpdate && email) {
      const emailExists = await prisma.user.findFirst({
        where: { 
          email,
          id: { not: studentId }
        }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already in use by another user' },
          { status: 400 }
        )
      }
    }

    // Check if A number already exists for another student (unless it's just an active status update)
    if (!isActiveStatusUpdate && aNumber) {
      const aNumberExists = await prisma.studentProfile.findFirst({
        where: { 
          aNumber,
          userId: { not: studentId }
        }
      })

      if (aNumberExists) {
        return NextResponse.json(
          { error: 'A number already in use by another student' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {}

    // Add active status if provided
    if (active !== undefined) {
      updateData.active = active
    }

    // Add other fields only if they're provided (not for active status updates)
    if (!isActiveStatusUpdate) {
      if (firstName) updateData.firstName = firstName
      if (lastName) updateData.lastName = lastName
      if (email) updateData.email = email

      // Add student profile updates if any profile fields are provided
      if (aNumber || program || cohort) {
        updateData.studentProfile = {
          update: {}
        }
        if (aNumber) updateData.studentProfile.update.aNumber = aNumber
        if (program) updateData.studentProfile.update.program = program
        if (cohort) updateData.studentProfile.update.cohort = cohort
      }
    }

    // Hash password if provided
    if (password && password.trim() !== '') {
      updateData.passwordHash = await bcrypt.hash(password, 12)
    }

    // Update student
    const updatedStudent = await prisma.user.update({
      where: { id: studentId },
      data: updateData,
      include: {
        studentProfile: true,
        studentFacultyAssignments: {
          include: {
            faculty: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedStudent)

  } catch (error) {
    console.error('Student PATCH error:', error)
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
    
    // Only allow admin users to delete students
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admin users can delete students' },
        { status: 403 }
      )
    }

    const { id: studentId } = await params

    // Check if student exists
    const existingStudent = await prisma.user.findUnique({
      where: { id: studentId, role: 'STUDENT' }
    })

    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Delete the student (this will cascade delete related records due to onDelete: Cascade)
    await prisma.user.delete({
      where: { id: studentId }
    })

    return NextResponse.json({ message: 'Student deleted successfully' })

  } catch (error) {
    console.error('Student DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireFacultyOrAdmin()
    const { id: studentId } = await params

    const student = await prisma.user.findUnique({
      where: { id: studentId, role: 'STUDENT' },
      include: {
        studentProfile: true,
        studentFacultyAssignments: {
          include: {
            faculty: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                facultyProfile: {
                  select: {
                    honorific: true
                  }
                }
              }
            }
          }
        },
        studentPlacements: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            term: true,
            requiredHours: true,
            approvedAt: true,
            cellPolicy: true,
            learningContract: true,
            checklist: true,
            site: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
                state: true,
                zip: true
              }
            },
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
                email: true,
                facultyProfile: {
                  select: {
                    honorific: true
                  }
                }
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
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(student)

  } catch (error) {
    console.error('Student GET by ID error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
