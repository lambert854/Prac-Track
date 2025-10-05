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

    // Check if user can access this student's data
    if (!canAccessStudentData(session.user.role, studentId, session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get active placement
    const placement = await prisma.placement.findFirst({
      where: {
        studentId,
        status: 'ACTIVE'
      },
      include: {
        site: true,
        supervisor: true,
        faculty: true
      }
    })

    // Get pending applications (PENDING, APPROVED_PENDING_CHECKLIST)
    const pendingApplications = await prisma.placement.findMany({
      where: {
        studentId,
        status: {
          in: ['PENDING', 'APPROVED_PENDING_CHECKLIST']
        }
      },
      include: {
        site: true,
        faculty: true
      },
      orderBy: {
        startDate: 'desc'
      }
    })

    // Get timesheet summary
    const timesheetSummary = await prisma.timesheetEntry.aggregate({
      where: {
        placementId: placement?.id
      },
      _sum: {
        hours: true
      }
    })

    const approvedHours = await prisma.timesheetEntry.aggregate({
      where: {
        placementId: placement?.id,
        status: 'APPROVED'
      },
      _sum: {
        hours: true
      }
    })

    const pendingHours = await prisma.timesheetEntry.aggregate({
      where: {
        placementId: placement?.id,
        status: {
          in: ['PENDING_SUPERVISOR', 'PENDING_FACULTY']
        }
      },
      _sum: {
        hours: true
      }
    })

    // Get pending tasks (simplified for now)
    const pendingTasks = []

    // Check for pending form submissions
    const pendingForms = await prisma.formSubmission.findMany({
      where: {
        placementId: placement?.id,
        status: 'DRAFT'
      },
      include: {
        template: true
      }
    })

    // Deduplicate tasks by template title
    const uniqueTemplates = new Set()
    pendingForms.forEach(form => {
      if (!uniqueTemplates.has(form.template.title)) {
        uniqueTemplates.add(form.template.title)
        pendingTasks.push({
          title: `Complete ${form.template.title}`,
          priority: 'High',
          type: 'form'
        })
      }
    })

    return NextResponse.json({
      placement,
      pendingApplications,
      timesheetSummary: {
        totalHours: Number(timesheetSummary._sum.hours || 0),
        approvedHours: Number(approvedHours._sum.hours || 0),
        pendingHours: Number(pendingHours._sum.hours || 0)
      },
      pendingTasks
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
