const { PrismaClient } = require('@prisma/client')
const { execSync } = require('child_process')

const prisma = new PrismaClient()

async function fixDatabase() {
  try {
    console.log('Fixing database schema...')
    
    // First, let's try to generate the Prisma client with the new schema
    console.log('Generating Prisma client...')
    execSync('npx prisma generate', { stdio: 'inherit' })
    
    // Now let's try to push the schema changes
    console.log('Pushing schema changes...')
    execSync('npx prisma db push', { stdio: 'inherit' })
    
    console.log('Database schema updated successfully!')
    
  } catch (error) {
    console.error('Error updating database:', error.message)
    
    // If that fails, let's try a different approach
    console.log('Trying alternative approach...')
    
    try {
      // Delete the existing database and recreate it
      console.log('Recreating database...')
      execSync('del prisma\\dev.db', { stdio: 'inherit' })
      execSync('npx prisma db push', { stdio: 'inherit' })
      execSync('npx prisma db seed', { stdio: 'inherit' })
      
      console.log('Database recreated successfully!')
    } catch (recreateError) {
      console.error('Failed to recreate database:', recreateError.message)
    }
  } finally {
    await prisma.$disconnect()
  }
}

fixDatabase()
