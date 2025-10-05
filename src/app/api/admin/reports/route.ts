import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireFacultyOrAdmin } from '@/lib/auth-helpers'

export async function GET() {
  try {
    const session = await requireFacultyOrAdmin()

    // Get total counts
    const [
      totalStudents,
      totalSupervisors,
      totalSites,
      totalPlacements,
      activePlacements,
      timesheetEntries,
      formSubmissions
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'SUPERVISOR' } }),
      prisma.site.count(),
      prisma.placement.count(),
      prisma.placement.count({ where: { status: 'ACTIVE' } }),
      prisma.timesheetEntry.findMany({
        select: { hours: true, facultyApprovedAt: true }
      }),
      prisma.formSubmission.findMany({
        where: { status: 'DRAFT' },
        select: { id: true }
      })
    ])

    // Calculate hours
    const totalHours = timesheetEntries.reduce((sum, entry) => sum + Number(entry.hours), 0)
    const approvedHours = timesheetEntries
      .filter(entry => entry.facultyApprovedAt)
      .reduce((sum, entry) => sum + Number(entry.hours), 0)
    const pendingHours = totalHours - approvedHours

    // Count students without placements
    const studentsWithoutPlacements = await prisma.user.count({
      where: {
        role: 'STUDENT',
        studentPlacements: {
          none: {
            status: 'ACTIVE'
          }
        }
      }
    })

    const reportData = {
      totalStudents,
      totalSupervisors,
      totalSites,
      totalPlacements,
      activePlacements,
      totalHours,
      approvedHours,
      pendingHours,
      missingEvaluations: formSubmissions.length,
      studentsWithoutPlacements
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Error fetching admin reports:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
