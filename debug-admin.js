const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function debugAdmin() {
  console.log('Checking database connection and users...')
  
  try {
    // Check if we can connect to the database
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Check all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      }
    })
    
    console.log('📊 Total users in database:', allUsers.length)
    console.log('👥 Users by role:')
    
    const usersByRole = allUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {})
    
    console.log(usersByRole)
    
    // Check for admin users specifically
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      }
    })
    
    console.log('🔑 Admin users:', adminUsers.length)
    if (adminUsers.length > 0) {
      console.log('Admin user details:', adminUsers)
    } else {
      console.log('❌ No admin users found!')
    }
    
    // Check for student users
    const studentUsers = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      }
    })
    
    console.log('🎓 Student users:', studentUsers.length)
    
  } catch (error) {
    console.error('❌ Database error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugAdmin()
