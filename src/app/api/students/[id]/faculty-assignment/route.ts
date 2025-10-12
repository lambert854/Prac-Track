import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canAccessStudentData } from '@/lib/auth-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: studentId } = await params

    // Check if user can access this student&apos;s data
    if (!canAccessStudentData(session.user.role, studentId, session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if student has a faculty assignment
    const facultyAssignment = await prisma.facultyAssignment.findFirst({
      where: {
        studentId
      },
      include: {
        faculty: {
          include: {
            facultyProfile: true
          }
        }
      }
    })

    return NextResponse.json({
      hasFacultyAssignment: !!facultyAssignment,
      facultyAssignment: facultyAssignment || null
    })

  } catch (error) {
    console.error('Faculty assignment check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
