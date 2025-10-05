const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function debugSarahJohnson() {
  try {
    console.log('🔍 Debugging Dr. Sarah Johnson...\n')

    // Find Dr. Sarah Johnson
    const sarahJohnson = await prisma.user.findFirst({
      where: {
        role: 'FACULTY',
        OR: [
          { firstName: { contains: 'Sarah' } },
          { lastName: { contains: 'Johnson' } },
          { email: { contains: 'faculty1@demo.edu' } }
        ]
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
        },
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
        },
        facultyApprovedTimesheets: {
          select: {
            id: true
          }
        },
        rejectedTimesheets: {
          select: {
            id: true
          }
        },
        submittedForms: {
          select: {
            id: true
          }
        },
        approvedForms: {
          select: {
            id: true
          }
        },
        notifications: {
          select: {
            id: true
          }
        },
        auditLogs: {
          select: {
            id: true
          }
        }
      }
    })

    if (!sarahJohnson) {
      console.log('❌ Dr. Sarah Johnson not found')
      return
    }

    console.log(`👤 Found: ${sarahJohnson.firstName} ${sarahJohnson.lastName} (${sarahJohnson.email})`)
    console.log(`📧 Email: ${sarahJohnson.email}`)
    console.log(`🎓 Title: ${sarahJohnson.facultyProfile?.title || 'No title'}`)
    
    console.log('\n📊 Relationship Analysis:')
    console.log(`   Faculty Student Assignments: ${sarahJohnson.facultyStudentAssignments.length}`)
    console.log(`   Faculty Placements: ${sarahJohnson.facultyPlacements.length}`)
    console.log(`   Faculty Approved Timesheets: ${sarahJohnson.facultyApprovedTimesheets.length}`)
    console.log(`   Rejected Timesheets: ${sarahJohnson.rejectedTimesheets.length}`)
    console.log(`   Submitted Forms: ${sarahJohnson.submittedForms.length}`)
    console.log(`   Approved Forms: ${sarahJohnson.approvedForms.length}`)
    console.log(`   Notifications: ${sarahJohnson.notifications.length}`)
    console.log(`   Audit Logs: ${sarahJohnson.auditLogs.length}`)

    if (sarahJohnson.facultyStudentAssignments.length > 0) {
      console.log('\n👥 Student Assignments:')
      sarahJohnson.facultyStudentAssignments.forEach(assignment => {
        console.log(`   - ${assignment.student.firstName} ${assignment.student.lastName} (${assignment.student.email})`)
      })
    }

    if (sarahJohnson.facultyPlacements.length > 0) {
      console.log('\n🏢 Faculty Placements:')
      sarahJohnson.facultyPlacements.forEach(placement => {
        console.log(`   - ${placement.student.firstName} ${placement.student.lastName} at ${placement.site.name}`)
      })
    }

    if (sarahJohnson.facultyApprovedTimesheets.length > 0) {
      console.log('\n⏰ Faculty Approved Timesheets:')
      sarahJohnson.facultyApprovedTimesheets.forEach(entry => {
        console.log(`   - Entry ID: ${entry.id}`)
      })
    }

    if (sarahJohnson.rejectedTimesheets.length > 0) {
      console.log('\n❌ Rejected Timesheets:')
      sarahJohnson.rejectedTimesheets.forEach(entry => {
        console.log(`   - Entry ID: ${entry.id}`)
      })
    }

    if (sarahJohnson.submittedForms.length > 0) {
      console.log('\n📝 Submitted Forms:')
      sarahJohnson.submittedForms.forEach(submission => {
        console.log(`   - Submission ID: ${submission.id}`)
      })
    }

    if (sarahJohnson.approvedForms.length > 0) {
      console.log('\n✅ Approved Forms:')
      sarahJohnson.approvedForms.forEach(submission => {
        console.log(`   - Submission ID: ${submission.id}`)
      })
    }

    console.log('\n🔍 Deletion Analysis:')
    const canDelete = sarahJohnson.facultyStudentAssignments.length === 0 && 
                     sarahJohnson.facultyPlacements.length === 0
    
    if (canDelete) {
      console.log('✅ Can be deleted - no blocking relationships')
    } else {
      console.log('❌ Cannot be deleted - has blocking relationships:')
      if (sarahJohnson.facultyStudentAssignments.length > 0) {
        console.log(`   - ${sarahJohnson.facultyStudentAssignments.length} student assignments`)
      }
      if (sarahJohnson.facultyPlacements.length > 0) {
        console.log(`   - ${sarahJohnson.facultyPlacements.length} faculty placements`)
      }
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugSarahJohnson()
