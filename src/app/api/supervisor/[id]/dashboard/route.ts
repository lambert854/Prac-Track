import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireSupervisor } from '@/lib/auth-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSupervisor()
    const { id: supervisorId } = await params

    // Ensure supervisor can only access their own dashboard
    if (session.user.id !== supervisorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get assigned students (placements where this supervisor is assigned)
    const assignedStudents = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        studentPlacements: {
          some: {
            supervisorId: supervisorId
          }
        }
      },
      include: {
        studentProfile: true,
        studentPlacements: {
          where: {
            supervisorId: supervisorId
          },
          include: {
            site: true
          },
          orderBy: {
            startDate: 'desc'
          }
        }
      },
      orderBy: {
        lastName: 'asc'
      }
    })

    // Add activePlacement field to each student
    const studentsWithActivePlacement = assignedStudents.map(student => ({
      ...student,
      activePlacement: student.studentPlacements.find(placement => placement.status === 'ACTIVE') || null
    }))

    // Get pending timesheets that need supervisor approval
    const pendingTimesheets = await prisma.timesheetEntry.findMany({
      where: {
        placement: {
          supervisorId: supervisorId
        },
        status: 'PENDING_SUPERVISOR'
      },
      include: {
        placement: {
          include: {
            student: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    })

    // Get pending forms that need supervisor review
    const pendingForms = await prisma.formSubmission.findMany({
      where: {
        placement: {
          supervisorId: supervisorId
        },
        status: 'SUBMITTED'
      },
      include: {
        template: true,
        placement: {
          include: {
            student: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Calculate summary statistics
    const summaryStats = {
      assignedStudents: studentsWithActivePlacement.length,
      pendingTimesheets: pendingTimesheets.length,
      pendingForms: pendingForms.length,
      activePlacements: studentsWithActivePlacement.filter(student => 
        student.activePlacement !== null
      ).length
    }

    return NextResponse.json({
      assignedStudents: studentsWithActivePlacement,
      pendingTimesheets,
      pendingForms,
      summaryStats
    })

  } catch (error) {
    console.error('Supervisor dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
