const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function transferAssignments() {
  try {
    console.log('🔄 Transferring faculty assignments...')
    
    // Find both Mackenzie Reffitt entries
    const mackenzieEntries = await prisma.user.findMany({
      where: { 
        role: 'FACULTY',
        firstName: { contains: 'Mackenzie' },
        lastName: { contains: 'Reffitt' }
      },
      include: { 
        facultyProfile: true,
        facultyStudentAssignments: {
          include: {
            student: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    })
    
    console.log('Found Mackenzie Reffitt entries:')
    mackenzieEntries.forEach((f, index) => {
      console.log(`${index + 1}. ${f.firstName} ${f.lastName} (${f.email}) - ${f.facultyStudentAssignments.length} assignments`)
      f.facultyStudentAssignments.forEach(assignment => {
        console.log(`   - ${assignment.student.firstName} ${assignment.student.lastName} (${assignment.student.email})`)
      })
    })
    
    // Find the one to keep (demo.edu) and the one to delete (wvstateu.edu)
    const toKeep = mackenzieEntries.find(f => f.email.includes('demo.edu'))
    const toDelete = mackenzieEntries.find(f => f.email.includes('wvstateu.edu'))
    
    if (!toKeep || !toDelete) {
      console.log('❌ Could not find both Mackenzie entries')
      return
    }
    
    console.log(`\n📋 Transferring assignments from ${toDelete.email} to ${toKeep.email}`)
    
    // Transfer all assignments
    for (const assignment of toDelete.facultyStudentAssignments) {
      console.log(`Transferring: ${assignment.student.firstName} ${assignment.student.lastName}`)
      
      // Update the assignment to point to the new faculty
      await prisma.facultyAssignment.update({
        where: {
          studentId_facultyId: {
            studentId: assignment.studentId,
            facultyId: toDelete.id
          }
        },
        data: {
          facultyId: toKeep.id
        }
      })
    }
    
    console.log(`\n✅ Transferred ${toDelete.facultyStudentAssignments.length} assignments`)
    
    // Now delete the duplicate
    console.log(`\n🗑️  Deleting duplicate: ${toDelete.firstName} ${toDelete.lastName} (${toDelete.email})`)
    
    await prisma.user.delete({
      where: { id: toDelete.id }
    })
    
    console.log('✅ Duplicate deleted successfully!')
    
  } catch (error) {
    console.error('❌ Error during transfer:', error)
  } finally {
    await prisma.$disconnect()
  }
}

transferAssignments()
