// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanupOrphanedSupervisors() {
  console.log('🔍 Starting supervisor cleanup for Neon PostgreSQL...')
  
  try {
    // Test database connection first
    await prisma.$connect()
    console.log('✅ Connected to Neon PostgreSQL database')

    // 1. Find and delete supervisor profiles with invalid user references
    console.log('\n📋 Checking supervisor profiles...')
    
    // First, get all supervisor profiles
    const allSupervisorProfiles = await prisma.supervisorProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        site: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Filter for orphaned ones
    const orphanedSupervisorProfiles = allSupervisorProfiles.filter(profile => {
      const user = profile.user
      return !user || 
             !user.firstName || 
             user.firstName === '' || 
             !user.lastName || 
             user.lastName === ''
    })

    if (orphanedSupervisorProfiles.length > 0) {
      console.log(`Found ${orphanedSupervisorProfiles.length} orphaned supervisor profiles:`)
      orphanedSupervisorProfiles.forEach(profile => {
        console.log(`  - Profile ID: ${profile.id}`)
        console.log(`    Site: ${profile.site.name}`)
        console.log(`    User: "${profile.user.firstName}" "${profile.user.lastName}" (${profile.user.email})`)
      })

      const deleteResult = await prisma.supervisorProfile.deleteMany({
        where: {
          id: {
            in: orphanedSupervisorProfiles.map(p => p.id)
          }
        }
      })
      console.log(`✅ Deleted ${deleteResult.count} orphaned supervisor profiles`)
    } else {
      console.log('✅ No orphaned supervisor profiles found')
    }

    // 2. Find and delete pending supervisors with invalid names
    console.log('\n📋 Checking pending supervisors...')
    
    // Get all pending supervisors and filter for invalid ones
    const allPendingSupervisors = await prisma.pendingSupervisor.findMany({
      include: {
        site: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    const invalidPendingSupervisors = allPendingSupervisors.filter(supervisor => {
      return !supervisor.firstName || 
             supervisor.firstName === '' || 
             !supervisor.lastName || 
             supervisor.lastName === ''
    })

    if (invalidPendingSupervisors.length > 0) {
      console.log(`Found ${invalidPendingSupervisors.length} pending supervisors with invalid names:`)
      invalidPendingSupervisors.forEach(supervisor => {
        console.log(`  - ID: ${supervisor.id}`)
        console.log(`    Site: ${supervisor.site.name}`)
        console.log(`    Name: "${supervisor.firstName}" "${supervisor.lastName}"`)
        console.log(`    Email: ${supervisor.email}`)
      })

      const deletePendingResult = await prisma.pendingSupervisor.deleteMany({
        where: {
          id: {
            in: invalidPendingSupervisors.map(s => s.id)
          }
        }
      })
      console.log(`✅ Deleted ${deletePendingResult.count} pending supervisors with invalid names`)
    } else {
      console.log('✅ No pending supervisors with invalid names found')
    }

    // 3. Check for any remaining issues
    console.log('\n📋 Final verification...')
    
    // Get all supervisor profiles and count invalid ones
    const allRemainingSupervisorProfiles = await prisma.supervisorProfile.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })
    
    const remainingIssues = allRemainingSupervisorProfiles.filter(profile => {
      const user = profile.user
      return !user || 
             !user.firstName || 
             user.firstName === '' || 
             !user.lastName || 
             user.lastName === ''
    }).length

    // Get all pending supervisors and count invalid ones
    const allRemainingPendingSupervisors = await prisma.pendingSupervisor.findMany()
    
    const remainingPendingIssues = allRemainingPendingSupervisors.filter(supervisor => {
      return !supervisor.firstName || 
             supervisor.firstName === '' || 
             !supervisor.lastName || 
             supervisor.lastName === ''
    }).length

    if (remainingIssues === 0 && remainingPendingIssues === 0) {
      console.log('🎉 Database cleanup completed successfully!')
      console.log('✨ No orphaned supervisor references remain')
    } else {
      console.log(`⚠️  Warning: ${remainingIssues} supervisor profiles and ${remainingPendingIssues} pending supervisors still have issues`)
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    console.error('This might be due to database connection issues or permission problems')
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Disconnected from database')
  }
}

// Run the cleanup
cleanupOrphanedSupervisors()
  .then(() => {
    console.log('\n✅ Cleanup script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Cleanup script failed:', error)
    process.exit(1)
  })
