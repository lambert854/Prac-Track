const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanupData() {
  try {
    console.log('Starting data cleanup...')

    // First, let's see what we have
    const timesheetEntries = await prisma.timesheetEntry.findMany({
      include: {
        placement: {
          include: {
            student: true
          }
        }
      }
    })

    console.log(`Found ${timesheetEntries.length} timesheet entries`)

    // Delete all existing timesheet entries to start fresh
    await prisma.timesheetEntry.deleteMany({})
    console.log('Deleted all existing timesheet entries')

    // Create some realistic sample data
    const placements = await prisma.placement.findMany({
      where: { status: 'ACTIVE' }
    })

    if (placements.length > 0) {
      const placement = placements[0]
      
      // Create realistic timesheet entries for the past week
      const today = new Date()
      const entries = []
      
      for (let i = 0; i < 5; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        
        // One entry per day with realistic hours
        const totalHours = Math.floor(Math.random() * 3) + 6 // 6-8 hours per day
        
        entries.push({
          placementId: placement.id,
          date: date,
          hours: totalHours,
          category: 'DIRECT',
          notes: `Day ${i + 1} of field placement - Direct client work`,
          approvedAt: i < 2 ? new Date() : null, // First 2 days approved
          approvedBy: i < 2 ? placement.supervisorId : null
        })
      }
      
      // Insert the new entries
      await prisma.timesheetEntry.createMany({
        data: entries
      })
      
      console.log(`Created ${entries.length} realistic timesheet entries`)
    }

    console.log('Data cleanup completed successfully!')
  } catch (error) {
    console.error('Error during cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupData()
