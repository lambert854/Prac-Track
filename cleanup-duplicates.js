const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanupDuplicates() {
  try {
    console.log('🔍 Checking for duplicate faculty members...')
    
    // Find all faculty members
    const faculty = await prisma.user.findMany({
      where: { role: 'FACULTY' },
      include: { facultyProfile: true }
    })
    
    console.log('Current faculty members:')
    faculty.forEach(f => {
      console.log(`- ${f.firstName} ${f.lastName} (${f.email})`)
    })
    
    // Find Mackenzie Reffitt duplicates
    const mackenzieDuplicates = faculty.filter(f => 
      f.firstName.toLowerCase().includes('mackenzie') && 
      f.lastName.toLowerCase().includes('reffitt')
    )
    
    if (mackenzieDuplicates.length > 1) {
      console.log(`\n🚨 Found ${mackenzieDuplicates.length} Mackenzie Reffitt entries:`)
      mackenzieDuplicates.forEach((f, index) => {
        console.log(`${index + 1}. ${f.firstName} ${f.lastName} (${f.email}) - ID: ${f.id}`)
      })
      
      // Keep the one with the demo.edu email (the one we created)
      const toKeep = mackenzieDuplicates.find(f => f.email.includes('demo.edu'))
      const toDelete = mackenzieDuplicates.filter(f => f.email !== toKeep.email)
      
      if (toDelete.length > 0) {
        console.log(`\n🗑️  Deleting duplicate(s):`)
        for (const duplicate of toDelete) {
          console.log(`Deleting: ${duplicate.firstName} ${duplicate.lastName} (${duplicate.email})`)
          
          // Check if this faculty has any assignments or placements
          const assignments = await prisma.facultyAssignment.findMany({
            where: { facultyId: duplicate.id }
          })
          
          const placements = await prisma.placement.findMany({
            where: { facultyId: duplicate.id }
          })
          
          if (assignments.length > 0 || placements.length > 0) {
            console.log(`⚠️  Cannot delete ${duplicate.firstName} ${duplicate.lastName} - has ${assignments.length} assignments and ${placements.length} placements`)
            continue
          }
          
          // Delete the duplicate
          await prisma.user.delete({
            where: { id: duplicate.id }
          })
          
          console.log(`✅ Deleted: ${duplicate.firstName} ${duplicate.lastName}`)
        }
      }
    } else {
      console.log('\n✅ No duplicate Mackenzie Reffitt entries found')
    }
    
    console.log('\n🎉 Cleanup completed!')
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupDuplicates()
