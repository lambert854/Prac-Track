const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixSarahJohnson() {
  try {
    console.log('🔧 Fixing Dr. Sarah Johnson deletion issue...\n')

    // Find Dr. Sarah Johnson
    const sarahJohnson = await prisma.user.findFirst({
      where: {
        role: 'FACULTY',
        email: 'faculty1@demo.edu'
      },
      include: {
        facultyPlacements: {
          include: {
            student: {
              select: {
                firstName: true,
                lastName: true
              }
            },
            site: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    if (!sarahJohnson) {
      console.log('❌ Dr. Sarah Johnson not found')
      return
    }

    console.log(`👤 Found: ${sarahJohnson.firstName} ${sarahJohnson.lastName}`)
    console.log(`📊 Faculty Placements: ${sarahJohnson.facultyPlacements.length}`)

    if (sarahJohnson.facultyPlacements.length === 0) {
      console.log('✅ No faculty placements to fix')
      return
    }

    // Find Mackenzie Reffitt to reassign placements to
    const mackenzieReffitt = await prisma.user.findFirst({
      where: {
        role: 'FACULTY',
        email: 'mackenzie.reffitt@demo.edu'
      }
    })

    if (!mackenzieReffitt) {
      console.log('❌ Mackenzie Reffitt not found - cannot reassign placements')
      return
    }

    console.log(`👤 Found replacement faculty: ${mackenzieReffitt.firstName} ${mackenzieReffitt.lastName}`)

    // Reassign all faculty placements to Mackenzie Reffitt
    console.log('\n🔄 Reassigning faculty placements...')
    
    for (const placement of sarahJohnson.facultyPlacements) {
      console.log(`   - Reassigning ${placement.student.firstName} ${placement.student.lastName} at ${placement.site.name}`)
      
      await prisma.placement.update({
        where: { id: placement.id },
        data: { facultyId: mackenzieReffitt.id }
      })
    }

    console.log(`✅ Reassigned ${sarahJohnson.facultyPlacements.length} placements to Mackenzie Reffitt`)

    // Now check if Sarah Johnson can be deleted
    const updatedSarahJohnson = await prisma.user.findUnique({
      where: { id: sarahJohnson.id },
      include: {
        facultyStudentAssignments: true,
        facultyPlacements: true
      }
    })

    console.log('\n🔍 Updated Analysis:')
    console.log(`   Faculty Student Assignments: ${updatedSarahJohnson.facultyStudentAssignments.length}`)
    console.log(`   Faculty Placements: ${updatedSarahJohnson.facultyPlacements.length}`)

    const canDelete = updatedSarahJohnson.facultyStudentAssignments.length === 0 && 
                     updatedSarahJohnson.facultyPlacements.length === 0

    if (canDelete) {
      console.log('✅ Dr. Sarah Johnson can now be deleted!')
    } else {
      console.log('❌ Still cannot delete - other relationships exist')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixSarahJohnson()
