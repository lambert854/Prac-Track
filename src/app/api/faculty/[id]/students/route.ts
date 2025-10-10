import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireFaculty } from '@/lib/auth-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireFaculty()
    const { id: facultyId } = await params

    // Ensure faculty can only access their own students
    if (session.user.id !== facultyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get assigned students (through faculty assignments)
    const assignedStudents = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        studentFacultyAssignments: {
          some: {
            facultyId: facultyId
          }
        }
      },
      include: {
        studentProfile: true,
        studentPlacements: {
          include: {
            site: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            startDate: 'desc'
          }
        }
      },
      orderBy: {
        firstName: 'asc'
      }
    })

    return NextResponse.json(assignedStudents)

  } catch (error) {
    console.error('Faculty students API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
