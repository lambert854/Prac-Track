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
    const { id: facultyId } = await params

    const body = await request.json()
    const { honorific, firstName, lastName, email, title, officePhone, roomNumber, password } = body

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if email already exists for a different user
    const existingUser = await prisma.user.findFirst({
      where: { 
        email,
        id: { not: facultyId }
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: {
      firstName: string
      lastName: string
      email: string
      facultyProfile: {
        upsert: {
          create: {
            honorific: string | null
            title: string | null
            officePhone: string | null
            roomNumber: string | null
          }
          update: {
            honorific: string | null
            title: string | null
            officePhone: string | null
            roomNumber: string | null
          }
        }
      }
      password?: string
    } = {
      firstName,
      lastName,
      email,
      facultyProfile: {
        upsert: {
          create: {
            honorific: honorific || null,
            title: title || null,
            officePhone: officePhone || null,
            roomNumber: roomNumber || null
          },
          update: {
            honorific: honorific || null,
            title: title || null,
            officePhone: officePhone || null,
            roomNumber: roomNumber || null
          }
        }
      }
    }

    // Hash password if provided
    if (password && password.trim() !== '') {
      updateData.passwordHash = await bcrypt.hash(password, 12)
    }

    // Update faculty user and profile
    const faculty = await prisma.user.update({
      where: { id: facultyId },
      data: updateData,
      include: {
        facultyProfile: true,
        facultyStudentAssignments: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
      }
    })

    return NextResponse.json(faculty)

  } catch (error) {
    console.error('Update faculty error:', error)
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
    const { id: facultyId } = await params

    // Check if faculty exists and has assignments
    const faculty = await prisma.user.findUnique({
      where: { id: facultyId, role: 'FACULTY' },
      include: {
        facultyStudentAssignments: true,
        facultyPlacements: true
      }
    })

    if (!faculty) {
      return NextResponse.json(
        { error: 'Faculty member not found' },
        { status: 404 }
      )
    }

    if (faculty.facultyStudentAssignments.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete faculty with assigned students' },
        { status: 400 }
      )
    }

    if (faculty.facultyPlacements.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete faculty with active placements' },
        { status: 400 }
      )
    }

    // Use a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      try {
        // Clear foreign key references
        await tx.timesheetEntry.updateMany({
          where: {
            OR: [
              { facultyApprovedBy: facultyId },
              { rejectedBy: facultyId }
            ]
          },
          data: {
            facultyApprovedBy: null,
            rejectedBy: null
          }
        })

        // For form submissions, we need to handle them differently since submittedBy is not nullable
        // We'll delete form submissions where the faculty is the submitter
        await tx.formSubmission.deleteMany({
          where: { submittedBy: facultyId }
        })

        // For form submissions where faculty is the approver, set approvedBy to null
        await tx.formSubmission.updateMany({
          where: { approvedBy: facultyId },
          data: { approvedBy: null }
        })

        // Delete notifications and audit logs for this user
        await tx.notification.deleteMany({
          where: { userId: facultyId }
        })

        await tx.auditLog.deleteMany({
          where: { userId: facultyId }
        })

        // Delete the user (cascade will handle faculty profile and assignments)
        await tx.user.delete({
          where: { id: facultyId }
        })
      } catch (transactionError) {
        console.error('Transaction error:', transactionError)
        throw transactionError
      }
    })

    return NextResponse.json({ message: 'Faculty member deleted successfully' })

  } catch (error) {
    console.error('Delete faculty error:', error)
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
