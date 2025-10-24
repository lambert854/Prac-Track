import { requireFacultyOrAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await requireFacultyOrAdmin()

    const sites = await prisma.site.findMany({
      select: {
        id: true,
        name: true,
        placements: {
          select: {
            id: true,
            status: true,
            timesheetEntries: {
              select: { hours: true }
            },
            student: {
              select: { active: true }
            }
          }
        }
      }
    })

    const siteReports = sites.map(site => {
      const placementCount = site.placements.length
      const totalHours = site.placements.reduce((sum, placement) => 
        sum + placement.timesheetEntries.reduce((entrySum, entry) => 
          entrySum + Number(entry.hours), 0), 0)
      const activeStudents = site.placements.filter(placement => 
        placement.status === 'ACTIVE' && placement.student.active
      ).length

      return {
        id: site.id,
        name: site.name,
        placementCount,
        totalHours,
        activeStudents
      }
    })

    return NextResponse.json(siteReports)
  } catch (error) {
    console.error('Error fetching site reports:', error)
    return NextResponse.json({ error: 'Failed to fetch site reports' }, { status: 500 })
  }
}
