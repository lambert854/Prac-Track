const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createPendingPlacement() {
  console.log('Creating a pending placement request...')
  
  try {
    // Find a student who doesn't have an active placement
    const student = await prisma.user.findFirst({
      where: { 
        role: 'STUDENT',
        // Make sure they don't already have an active placement
        studentPlacements: {
          none: {
            status: { in: ['PENDING', 'APPROVED', 'ACTIVE'] }
          }
        }
      },
      include: { studentProfile: true }
    })

    if (!student) {
      console.log('No available student found (all students already have placements)')
      return
    }

    // Find an active site
    const site = await prisma.site.findFirst({
      where: { active: true }
    })

    if (!site) {
      console.log('No active sites found')
      return
    }

    // Find a supervisor
    const supervisor = await prisma.user.findFirst({
      where: { role: 'SUPERVISOR' },
      include: { supervisorProfile: true }
    })

    if (!supervisor) {
      console.log('No supervisor found')
      return
    }

    // Find a faculty member
    const faculty = await prisma.user.findFirst({
      where: { role: 'FACULTY' },
      include: { facultyProfile: true }
    })

    if (!faculty) {
      console.log('No faculty member found')
      return
    }

    // Create a pending placement request
    const placement = await prisma.placement.create({
      data: {
        studentId: student.studentProfile.id,
        siteId: site.id,
        supervisorId: supervisor.id,
        facultyId: faculty.id,
        startDate: new Date('2024-12-01'),
        endDate: new Date('2025-05-15'),
        status: 'PENDING',
        requiredHoursOverride: null,
        complianceChecklist: JSON.stringify({
          orientation: false,
          safetyTraining: false,
          confidentiality: false,
          supervisionSchedule: false,
        }),
      },
      include: {
        student: true,
        site: true,
        supervisor: true,
        faculty: true
      }
    })

    console.log('✅ Created pending placement request:')
    console.log(`   Student: ${placement.student.firstName} ${placement.student.lastName}`)
    console.log(`   Site: ${placement.site.name}`)
    console.log(`   Status: ${placement.status}`)
    console.log(`   Start Date: ${placement.startDate.toLocaleDateString()}`)
    console.log(`   End Date: ${placement.endDate.toLocaleDateString()}`)

  } catch (error) {
    console.error('❌ Error creating pending placement:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createPendingPlacement()
