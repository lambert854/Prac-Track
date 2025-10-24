import { requireSupervisor } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

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

    // Get pending timesheets that need supervisor approval - group by week and student
    const pendingTimesheetEntries = await prisma.timesheetEntry.findMany({
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

    // Group timesheet entries by week and student
    const groupedTimesheets = new Map<string, any>()
    
    pendingTimesheetEntries.forEach(entry => {
      const studentId = entry.placement.student.id
      const studentName = `${entry.placement.student.firstName} ${entry.placement.student.lastName}`
      
      // Calculate week start date (Monday of the week)
      const entryDate = new Date(entry.date)
      const dayOfWeek = entryDate.getDay()
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Adjust for Sunday being 0
      const weekStart = new Date(entryDate)
      weekStart.setDate(entryDate.getDate() + mondayOffset)
      weekStart.setHours(0, 0, 0, 0)
      
      const weekKey = `${studentId}-${weekStart.toISOString().split('T')[0]}`
      
      if (!groupedTimesheets.has(weekKey)) {
        groupedTimesheets.set(weekKey, {
          id: weekKey,
          studentId,
          studentName,
          weekStart: weekStart.toISOString(),
          weekEnd: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
          placementId: entry.placementId,
          placement: entry.placement,
          entryCount: 0,
          totalHours: 0,
          earliestSubmittedAt: entry.submittedAt,
          latestSubmittedAt: entry.submittedAt
        })
      }
      
      const group = groupedTimesheets.get(weekKey)!
      group.entryCount += 1
      group.totalHours += Number(entry.hours)
      
      if (entry.submittedAt) {
        if (!group.earliestSubmittedAt || entry.submittedAt < group.earliestSubmittedAt) {
          group.earliestSubmittedAt = entry.submittedAt
        }
        if (!group.latestSubmittedAt || entry.submittedAt > group.latestSubmittedAt) {
          group.latestSubmittedAt = entry.submittedAt
        }
      }
    })

    const pendingTimesheets = Array.from(groupedTimesheets.values())
      .sort((a, b) => new Date(b.latestSubmittedAt || 0).getTime() - new Date(a.earliestSubmittedAt || 0).getTime())

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
