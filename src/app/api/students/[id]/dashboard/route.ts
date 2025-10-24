import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

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
    // For students, we need to check if the studentId matches their student profile ID
    let canAccess = false
    if (session.user.role === 'ADMIN' || session.user.role === 'FACULTY') {
      canAccess = true
    } else if (session.user.role === 'STUDENT' && session.user.studentProfile?.id === studentId) {
      canAccess = true
    }
    
    if (!canAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get active placement (ACTIVE, APPROVED, or APPROVED_PENDING_CHECKLIST)
    console.log('Dashboard API - Looking for placements for user ID:', session.user.id)
    
    // Query placements using the user ID (not student profile ID)
    const placement = await prisma.placement.findFirst({
      where: {
        studentId: session.user.id,
        status: {
          in: ['ACTIVE', 'APPROVED', 'APPROVED_PENDING_CHECKLIST']
        }
      },
      include: {
        site: true,
        supervisor: true,
        faculty: true,
        class: true
      }
    })
    console.log('Dashboard API - Found placement:', placement ? `${placement.site?.name} (${placement.status})` : 'None')

    // Get pending applications (only PENDING status, not approved ones)
    const pendingApplications = await prisma.placement.findMany({
      where: {
        studentId: session.user.id,
        status: 'PENDING'
      },
      include: {
        site: true,
        faculty: true,
        class: true
      },
      orderBy: {
        startDate: 'desc'
      }
    })

    // Get rejected placements (DECLINED) - show the most recent one that has a rejection reason
    const rejectedPlacement = await prisma.placement.findFirst({
      where: {
        studentId: session.user.id,
        status: 'DECLINED',
        facultyNotes: {
          not: null
        }
      },
      include: {
        site: true,
        faculty: true,
        class: true
      },
      orderBy: {
        declinedAt: 'desc'
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
        facultyApprovedAt: {
          not: null
        }
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

    // Check for pending evaluations via notifications and submissions
    if (placement?.id) {
      // First check for evaluation notifications
      const evaluationNotifications = await prisma.notification.findMany({
        where: {
          userId: session.user.id,
          type: 'EVALUATION_SENT',
          read: false
        },
        include: {
          // We'll get the evaluation type from the related entity
        }
      })

      // Also check for pending evaluation submissions
      const pendingEvaluations = await prisma.evaluationSubmission.findMany({
        where: {
          evaluation: {
            placementId: placement.id
          },
          role: 'STUDENT',
          status: {
            in: ['PENDING', 'IN_PROGRESS']
          }
        },
        include: {
          evaluation: {
            select: {
              type: true
            }
          }
        }
      })

      // Track evaluation types to avoid duplicates
      const addedEvaluationTypes = new Set()

      // Add evaluation tasks from notifications
      for (const notification of evaluationNotifications) {
        // Skip if no related entity ID
        if (!notification.relatedEntityId) continue
        
        // Get the evaluation submission for this student
        const evaluationSubmission = await prisma.evaluationSubmission.findFirst({
          where: {
            evaluationId: notification.relatedEntityId,
            role: 'STUDENT',
            status: {
              in: ['PENDING', 'IN_PROGRESS']
            }
          }
        })

        if (evaluationSubmission) {
          // Extract evaluation type from title
          const isMidTerm = notification.title.includes('Mid-Term')
          const evaluationType = isMidTerm ? 'Mid-Term' : 'Final'
          
          // Only add if we haven't already added this evaluation type
          if (!addedEvaluationTypes.has(evaluationType)) {
            addedEvaluationTypes.add(evaluationType)
            pendingTasks.push({
              title: `Complete ${evaluationType} Self-Evaluation`,
              priority: 'High',
              type: 'evaluation',
              notificationId: notification.id,
              evaluationId: evaluationSubmission.id
            })
          }
        }
      }

      // Add evaluation tasks from submissions (fallback for any not covered by notifications)
      pendingEvaluations.forEach(evaluation => {
        const evaluationType = evaluation.evaluation.type === 'MIDTERM' ? 'Mid-Term' : 'Final'
        
        // Only add if we haven't already added this evaluation type
        if (!addedEvaluationTypes.has(evaluationType)) {
          addedEvaluationTypes.add(evaluationType)
          pendingTasks.push({
            title: `Complete ${evaluationType} Self-Evaluation`,
            priority: 'High',
            type: 'evaluation',
            evaluationId: evaluation.id
          })
        }
      })
    }

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

    const responseData = {
      placement,
      pendingApplications,
      rejectedPlacement,
      timesheetSummary: {
        totalHours: Number(timesheetSummary._sum.hours || 0),
        approvedHours: Number(approvedHours._sum.hours || 0),
        pendingHours: Number(pendingHours._sum.hours || 0)
      },
      approvedHours: Number(approvedHours._sum.hours || 0),
      pendingTasks
    }
    
    console.log('Dashboard API - Returning data:', {
      hasPlacement: !!placement,
      placementStatus: placement?.status,
      placementSite: placement?.site?.name,
      pendingTasksCount: pendingTasks?.length || 0
    })
    
    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
