import { requireFacultyOrAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await requireFacultyOrAdmin()

    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' }, // Include all students (active + inactive)
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        active: true, // Include active status
        studentPlacements: {
          select: {
            id: true,
            timesheetEntries: {
              select: { hours: true, facultyApprovedAt: true }
            },
            formSubmissions: {
              where: { status: 'DRAFT' },
              select: { id: true }
            }
          }
        }
      }
    })

    const studentReports = students.map(student => {
      const placementCount = student.studentPlacements.length
      const totalHours = student.studentPlacements.reduce((sum, placement) => 
        sum + placement.timesheetEntries.reduce((entrySum, entry) => 
          entrySum + Number(entry.hours), 0), 0)
      const approvedHours = student.studentPlacements.reduce((sum, placement) => 
        sum + placement.timesheetEntries
          .filter(entry => entry.facultyApprovedAt)
          .reduce((entrySum, entry) => entrySum + Number(entry.hours), 0), 0)
      const missingEvaluations = student.studentPlacements.reduce((sum, placement) => 
        sum + placement.formSubmissions.length, 0)

      return {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        active: student.active, // Include active status
        placementCount,
        totalHours,
        approvedHours,
        missingEvaluations
      }
    })

    return NextResponse.json(studentReports)
  } catch (error) {
    console.error('Error fetching student reports:', error)
    return NextResponse.json({ error: 'Failed to fetch student reports' }, { status: 500 })
  }
}
