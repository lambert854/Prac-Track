import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get current date for calculations
    const now = new Date()
    const oneMonthFromNow = new Date()
    oneMonthFromNow.setMonth(now.getMonth() + 1)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(now.getDate() - 7)

    // Get all the dashboard data in parallel
    const [
      totalStudents,
      totalSites,
      totalPlacements,
      totalFaculty,
      totalSupervisors,
      pendingPlacements,
      approvedPlacementsWithoutSupervisors,
      studentsWithoutPlacements,
      expiredAgreements,
      expiringAgreements,
      pendingTimesheets,
      recentActivity
    ] = await Promise.all([
      // Total counts
      prisma.user.count({ where: { role: 'STUDENT', active: true } }),
      prisma.site.count({ where: { active: true } }),
      prisma.placement.count({ where: { status: 'APPROVED' } }),
      prisma.user.count({ where: { role: 'FACULTY', active: true } }),
      prisma.user.count({ where: { role: 'SUPERVISOR', active: true } }),
      
      // Pending placements
      prisma.placement.count({ where: { status: 'PENDING' } }),
      
      // Placements that need supervisor assignment
      // Note: Supervisor assignment is now handled during student application, so no need to check for missing supervisors
      0,
      
      // Students without placements
      prisma.user.count({
        where: {
          role: 'STUDENT',
          active: true,
          studentPlacements: {
            none: {
              status: 'APPROVED'
            }
          }
        }
      }),
      
      // Expired agreements
      prisma.site.count({
        where: {
          active: true,
          agreementExpirationDate: {
            lt: now
          }
        }
      }),
      
      // Expiring agreements (within 1 month)
      prisma.site.count({
        where: {
          active: true,
          agreementExpirationDate: {
            gte: now,
            lte: oneMonthFromNow
          }
        }
      }),
      
      // Pending timesheets
      prisma.timesheetEntry.count({
        where: {
          OR: [
            { status: 'PENDING_SUPERVISOR' },
            { status: 'PENDING_FACULTY' }
          ]
        }
      }),
      
      // Recent activity (last 7 days)
      prisma.user.count({
        where: {
          createdAt: {
            gte: oneWeekAgo
          }
        }
      })
    ])

    const dashboardData = {
      summary: {
        totalStudents,
        totalSites,
        totalPlacements,
        totalFaculty,
        totalSupervisors
      },
      alerts: {
        pendingPlacements,
        approvedPlacementsWithoutSupervisors,
        studentsWithoutPlacements,
        expiredAgreements,
        expiringAgreements,
        pendingTimesheets
      },
      activity: {
        newUsersThisWeek: recentActivity
      }
    }

    // Get class mismatch notifications for admin
    const classMismatchNotifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
        type: 'FACULTY_CLASS_MISMATCH',
        read: false
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5 // Limit to 5 most recent
    })

    // Add notifications to dashboard data
    dashboardData.notifications = {
      classMismatches: classMismatchNotifications
    }

    return NextResponse.json(dashboardData)

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

