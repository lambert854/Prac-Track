import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireFacultyOrAdmin, requireAdmin } from '@/lib/auth-helpers'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireFacultyOrAdmin()
    const { id } = await params

    const body = await request.json()
    const { facultyId } = body

    if (!facultyId) {
      return NextResponse.json(
        { error: 'Faculty ID is required' },
        { status: 400 }
      )
    }

    // Verify the faculty exists
    const faculty = await prisma.user.findUnique({
      where: { id: facultyId, role: 'FACULTY' }
    })

    if (!faculty) {
      return NextResponse.json(
        { error: 'Faculty member not found' },
        { status: 404 }
      )
    }

    // Get the current assignment to find the student ID
    const currentAssignment = await prisma.facultyAssignment.findUnique({
      where: { id },
      include: {
        student: {
          select: { id: true }
        }
      }
    })

    if (!currentAssignment) {
      return NextResponse.json(
        { error: 'Faculty assignment not found' },
        { status: 404 }
      )
    }

    const studentId = currentAssignment.student.id

    // Update the faculty assignment
    const updatedAssignment = await prisma.facultyAssignment.update({
      where: { id },
      data: { facultyId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            studentProfile: {
              select: {
                program: true,
                cohort: true
              }
            }
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
                title: true
              }
            }
          }
        }
      }
    })

    // Update any pending placements for this student to the new faculty
    const updatedPlacements = await prisma.placement.updateMany({
      where: {
        studentId: studentId,
        status: {
          in: ['PENDING', 'APPROVED_PENDING_CHECKLIST']
        }
      },
      data: {
        facultyId: facultyId
      }
    })
    

    // Clear faculty mismatch notifications for the OLD faculty member when assignment is corrected
    // This ensures that when a student is reassigned to the correct faculty for their class,
    // the mismatch notification disappears from the old faculty member&apos;s dashboard
    const clearedNotifications = await prisma.notification.deleteMany({
      where: {
        userId: currentAssignment.facultyId, // Clear notifications for the OLD faculty member
        type: 'FACULTY_CLASS_MISMATCH',
        relatedEntityId: studentId
      }
    })
    

    return NextResponse.json(updatedAssignment)

  } catch (error) {
    console.error('Faculty assignment PATCH error:', error)
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
    const { id } = await params

    // Delete the faculty assignment
    await prisma.facultyAssignment.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Faculty assignment DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
