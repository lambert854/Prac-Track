const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testFaculty() {
  try {
    console.log('Testing faculty query...')
    
    // First, let's check if we have any users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true
      }
    })
    console.log('All users:', allUsers)
    
    // Then check faculty specifically
    const faculty = await prisma.user.findMany({
      where: {
        role: 'FACULTY'
      },
      include: {
        facultyProfile: true
      }
    })
    console.log('Faculty found:', faculty.length)
    console.log('Faculty data:', faculty)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testFaculty()
