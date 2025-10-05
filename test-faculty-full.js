const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testFacultyFull() {
  try {
    console.log('Testing full faculty query...')
    
    const faculty = await prisma.user.findMany({
      where: {
        role: 'FACULTY'
      },
      include: {
        facultyProfile: true,
        facultyStudentAssignments: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        facultyPlacements: {
          include: {
            student: {
              select: {
                firstName: true,
                lastName: true
              }
            }
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
    
    console.log('Faculty found:', faculty.length)
    console.log('Faculty data:', JSON.stringify(faculty, null, 2))
    
  } catch (error) {
    console.error('Error:', error)
    console.error('Error message:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testFacultyFull()
