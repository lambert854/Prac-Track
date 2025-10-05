const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testDatabase() {
  try {
    console.log('Testing database connection...')
    
    // Check if students exist
    const studentCount = await prisma.user.count({
      where: { role: 'STUDENT' }
    })
    
    console.log(`Found ${studentCount} students in database`)
    
    if (studentCount > 0) {
      const students = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
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
      
      console.log('Students with placements:', students.length)
      students.forEach(student => {
        console.log(`- ${student.firstName} ${student.lastName}: ${student.studentPlacements.length} placements`)
      })
    }
    
  } catch (error) {
    console.error('Database test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()
