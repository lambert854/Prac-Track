import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireFacultyOrAdmin } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const session = await requireFacultyOrAdmin()

    // Get all faculty assignments with student and faculty details
    const assignments = await prisma.facultyAssignment.findMany({
      include: {
        student: {
          include: {
            studentProfile: true,
            studentPlacements: {
              include: {
                site: true
              },
              orderBy: {
                startDate: 'desc'
              }
            }
          }
        },
        faculty: {
          include: {
            facultyProfile: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(assignments)

  } catch (error) {
    console.error('Faculty assignments GET error:', error)
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
    const { studentId, facultyId } = body

    if (!studentId || !facultyId) {
      return NextResponse.json(
        { error: 'Student ID and Faculty ID are required' },
        { status: 400 }
      )
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.facultyAssignment.findUnique({
      where: {
        studentId_facultyId: {
          studentId,
          facultyId
        }
      }
    })

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Student is already assigned to this faculty member' },
        { status: 400 }
      )
    }

    // Create the assignment
    const assignment = await prisma.facultyAssignment.create({
      data: {
        studentId,
        facultyId
      },
      include: {
        student: {
          include: {
            studentProfile: true
          }
        },
        faculty: {
          include: {
            facultyProfile: true
          }
        }
      }
    })

    return NextResponse.json(assignment, { status: 201 })

  } catch (error) {
    console.error('Faculty assignment POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
