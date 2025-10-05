const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createStudentAndPending() {
  console.log('Creating a new student and pending placement request...')
  
  try {
    // Create a new student
    const student = await prisma.user.create({
      data: {
        email: 'student3@demo.edu',
        passwordHash: '$2a$10$dummy.hash.for.demo.purposes',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'STUDENT',
        studentProfile: {
          create: {
            program: 'MSW',
            cohort: '2024',
            requiredHours: 900,
            term: 'FALL'
          }
        }
      },
      include: { studentProfile: true }
    })

    console.log(`✅ Created student: ${student.firstName} ${student.lastName}`)

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
        studentId: student.id,
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
    console.error('❌ Error creating student and pending placement:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createStudentAndPending()
