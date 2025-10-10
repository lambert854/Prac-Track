import { PrismaClient, UserRole, PlacementStatus, TimesheetCategory, FormTemplateKey, FormSubmissionRole, FormSubmissionStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create users
  const hashedPassword = await bcrypt.hash('Passw0rd!', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.edu' },
    update: {},
    create: {
      email: 'admin@demo.edu',
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    },
  })

  const faculty1 = await prisma.user.upsert({
    where: { email: 'faculty1@demo.edu' },
    update: {},
    create: {
      email: 'faculty1@demo.edu',
      passwordHash: hashedPassword,
      firstName: 'Dr. Sarah',
      lastName: 'Johnson',
      role: UserRole.FACULTY,
      facultyProfile: {
        create: {
          title: 'Field Education Director',
          officePhone: '(555) 123-4567',
        },
      },
    },
  })

  const faculty2 = await prisma.user.upsert({
    where: { email: 'mackenzie.reffitt@demo.edu' },
    update: {},
    create: {
      email: 'mackenzie.reffitt@demo.edu',
      passwordHash: hashedPassword,
      firstName: 'Mackenzie',
      lastName: 'Reffitt',
      role: UserRole.FACULTY,
      facultyProfile: {
        create: {
          title: 'Field Education Coordinator',
          officePhone: '(555) 234-5678',
        },
      },
    },
  })

  // Create supervisors after sites are created
  const supervisor1 = await prisma.user.upsert({
    where: { email: 'supervisor1@demo.edu' },
    update: {},
    create: {
      email: 'supervisor1@demo.edu',
      passwordHash: hashedPassword,
      firstName: 'Michael',
      lastName: 'Rodriguez',
      role: UserRole.SUPERVISOR,
    },
  })

  const student1 = await prisma.user.upsert({
    where: { email: 'student1@demo.edu' },
    update: {},
    create: {
      email: 'student1@demo.edu',
      passwordHash: hashedPassword,
      firstName: 'Emily',
      lastName: 'Chen',
      role: UserRole.STUDENT,
      studentProfile: {
        create: {
          aNumber: 'A0001001',
          program: 'MSW',
          cohort: '2024',
        },
      },
    },
  })

  const student2 = await prisma.user.upsert({
    where: { email: 'student2@demo.edu' },
    update: {},
    create: {
      email: 'student2@demo.edu',
      passwordHash: hashedPassword,
      firstName: 'James',
      lastName: 'Wilson',
      role: UserRole.STUDENT,
      studentProfile: {
        create: {
          aNumber: 'A0001002',
          program: 'MSW',
          cohort: '2024',
        },
      },
    },
  })

  // Create classes
  const classes = await Promise.all([
    prisma.class.upsert({
      where: { id: 'class-1' },
      update: {},
      create: {
        id: 'class-1',
        name: 'Social Work Practicum I',
        hours: 900,
        facultyId: faculty1.id,
      },
    }),
    prisma.class.upsert({
      where: { id: 'class-2' },
      update: {},
      create: {
        id: 'class-2',
        name: 'Social Work Practicum II',
        hours: 900,
        facultyId: faculty1.id,
      },
    }),
  ])

  // Create sites
  const sites = await Promise.all([
    prisma.site.upsert({
      where: { id: 'site-1' },
      update: {},
      create: {
        id: 'site-1',
        name: 'Community Health Center',
        address: '123 Main Street',
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
        contactName: 'Michael Rodriguez',
        contactEmail: 'supervisor1@demo.edu',
        contactPhone: '(555) 234-5678',
        practiceAreas: 'Healthcare, Mental Health, Community Outreach',
      },
    }),
    prisma.site.upsert({
      where: { id: 'site-2' },
      update: {},
      create: {
        id: 'site-2',
        name: 'Family Services Agency',
        address: '456 Oak Avenue',
        city: 'Springfield',
        state: 'IL',
        zip: '62702',
        contactName: 'Lisa Thompson',
        contactEmail: 'lisa.thompson@familyservices.org',
        contactPhone: '(555) 345-6789',
        practiceAreas: 'Child Welfare, Family Therapy, Crisis Intervention',
      },
    }),
    prisma.site.upsert({
      where: { id: 'site-3' },
      update: {},
      create: {
        id: 'site-3',
        name: 'Senior Living Community',
        address: '789 Pine Street',
        city: 'Springfield',
        state: 'IL',
        zip: '62703',
        contactName: 'Robert Davis',
        contactEmail: 'robert.davis@seniorliving.org',
        contactPhone: '(555) 456-7890',
        practiceAreas: 'Gerontology, Case Management, Advocacy',
      },
    }),
    prisma.site.upsert({
      where: { id: 'site-4' },
      update: {},
      create: {
        id: 'site-4',
        name: 'Youth Development Center',
        address: '321 Elm Street',
        city: 'Springfield',
        state: 'IL',
        zip: '62704',
        contactName: 'Maria Garcia',
        contactEmail: 'maria.garcia@youthcenter.org',
        contactPhone: '(555) 567-8901',
        practiceAreas: 'Youth Services, Education, Prevention',
      },
    }),
    prisma.site.upsert({
      where: { id: 'site-5' },
      update: {},
      create: {
        id: 'site-5',
        name: 'Substance Abuse Treatment Center',
        address: '654 Maple Drive',
        city: 'Springfield',
        state: 'IL',
        zip: '62705',
        contactName: 'David Lee',
        contactEmail: 'david.lee@treatmentcenter.org',
        contactPhone: '(555) 678-9012',
        practiceAreas: 'Addiction Treatment, Group Therapy, Recovery Support',
      },
    }),
  ])

  // Create supervisor profiles (after sites are created)
  await prisma.supervisorProfile.upsert({
    where: { userId: supervisor1.id },
    update: {},
    create: {
      userId: supervisor1.id,
      siteId: sites[0].id, // Community Health Center
      title: 'Clinical Supervisor',
    },
  })

  // Create placements
  const startDate = new Date('2024-08-26')
  const endDate = new Date('2024-12-13')

  const placements = await Promise.all([
    prisma.placement.upsert({
      where: { id: 'placement-1' },
      update: {},
      create: {
        id: 'placement-1',
        studentId: student1.id,
        siteId: sites[0].id,
        supervisorId: supervisor1.id,
        facultyId: faculty1.id,
        classId: classes[0].id,
        startDate,
        endDate,
        status: PlacementStatus.ACTIVE,
        requiredHours: 900,
        complianceChecklist: JSON.stringify({
          orientation: true,
          safetyTraining: true,
          confidentiality: true,
          supervisionSchedule: true,
        }),
      },
    }),
    prisma.placement.upsert({
      where: { id: 'placement-2' },
      update: {},
      create: {
        id: 'placement-2',
        studentId: student2.id,
        siteId: sites[1].id,
        supervisorId: supervisor1.id,
        facultyId: faculty1.id,
        classId: classes[0].id,
        startDate,
        endDate,
        status: PlacementStatus.ACTIVE,
        requiredHours: 900,
        complianceChecklist: JSON.stringify({
          orientation: true,
          safetyTraining: true,
          confidentiality: true,
          supervisionSchedule: false,
        }),
      },
    }),
    prisma.placement.upsert({
      where: { id: 'placement-3' },
      update: {},
      create: {
        id: 'placement-3',
        studentId: student1.id,
        siteId: sites[2].id,
        supervisorId: supervisor1.id,
        facultyId: faculty1.id,
        classId: classes[0].id,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-05-10'),
        status: PlacementStatus.COMPLETE,
        requiredHours: 900,
        complianceChecklist: JSON.stringify({
          orientation: true,
          safetyTraining: true,
          confidentiality: true,
          supervisionSchedule: true,
        }),
      },
    }),
  ])

  // Create faculty assignments
  const facultyAssignments = await Promise.all([
    prisma.facultyAssignment.upsert({
      where: {
        studentId_facultyId: {
          studentId: student1.id,
          facultyId: faculty1.id,
        },
      },
      update: {},
      create: {
        studentId: student1.id,
        facultyId: faculty1.id,
      },
    }),
    prisma.facultyAssignment.upsert({
      where: {
        studentId_facultyId: {
          studentId: student2.id,
          facultyId: faculty1.id,
        },
      },
      update: {},
      create: {
        studentId: student2.id,
        facultyId: faculty1.id,
      },
    }),
  ])

  // Create timesheet entries
  const currentWeek = new Date()
  const weekStart = new Date(currentWeek)
  weekStart.setDate(currentWeek.getDate() - currentWeek.getDay())

  const timesheetEntries = []
  for (let i = 0; i < 5; i++) {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)

    // Create timesheet entry with new schema
    const entry = await prisma.timesheetEntry.create({
      data: {
        placementId: placements[0].id,
        date,
        hours: 8,
        category: TimesheetCategory.DIRECT,
        notes: `Day ${i + 1} of field placement`,
        status: i < 2 ? 'APPROVED' : i < 3 ? 'PENDING_FACULTY' : 'DRAFT',
        submittedAt: i < 3 ? new Date() : null,
        supervisorApprovedAt: i < 2 ? new Date() : null,
        supervisorApprovedBy: i < 2 ? supervisor1.id : null,
        facultyApprovedAt: i < 2 ? new Date() : null,
        facultyApprovedBy: i < 2 ? faculty1.id : null,
        locked: i < 2,
      },
    })
    timesheetEntries.push(entry)
  }

  await Promise.all(timesheetEntries)

  // Create form templates
  const learningContractSchema = {
    type: 'object',
    properties: {
      learningGoals: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            goal: { type: 'string' },
            activities: { type: 'string' },
            evaluation: { type: 'string' },
          },
        },
      },
      supervisionSchedule: { type: 'string' },
      evaluationMethods: { type: 'string' },
      studentSignature: { type: 'string' },
      supervisorSignature: { type: 'string' },
      facultySignature: { type: 'string' },
    },
    required: ['learningGoals', 'supervisionSchedule', 'evaluationMethods'],
  }

  const evaluationSchema = {
    type: 'object',
    properties: {
      competencies: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            competency: { type: 'string' },
            rating: { type: 'string', enum: ['Below Expectations', 'Meets Expectations', 'Exceeds Expectations'] },
            comments: { type: 'string' },
          },
        },
      },
      strengths: { type: 'string' },
      areasForImprovement: { type: 'string' },
      overallRating: { type: 'string', enum: ['Below Expectations', 'Meets Expectations', 'Exceeds Expectations'] },
      supervisorComments: { type: 'string' },
    },
    required: ['competencies', 'strengths', 'areasForImprovement', 'overallRating'],
  }

  const formTemplates = await Promise.all([
    prisma.formTemplate.upsert({
      where: { key: FormTemplateKey.LEARNING_CONTRACT },
      update: {},
      create: {
        key: FormTemplateKey.LEARNING_CONTRACT,
        title: 'Learning Contract',
        jsonSchema: JSON.stringify(learningContractSchema),
        uiSchema: JSON.stringify({
          learningGoals: {
            items: {
              goal: { 'ui:widget': 'textarea' },
              activities: { 'ui:widget': 'textarea' },
              evaluation: { 'ui:widget': 'textarea' },
            },
          },
          supervisionSchedule: { 'ui:widget': 'textarea' },
          evaluationMethods: { 'ui:widget': 'textarea' },
        }),
      },
    }),
    prisma.formTemplate.upsert({
      where: { key: FormTemplateKey.MIDTERM_EVAL },
      update: {},
      create: {
        key: FormTemplateKey.MIDTERM_EVAL,
        title: 'Midterm Evaluation',
        jsonSchema: JSON.stringify(evaluationSchema),
        uiSchema: JSON.stringify({
          competencies: {
            items: {
              competency: { 'ui:widget': 'textarea' },
              rating: { 'ui:widget': 'select' },
              comments: { 'ui:widget': 'textarea' },
            },
          },
          strengths: { 'ui:widget': 'textarea' },
          areasForImprovement: { 'ui:widget': 'textarea' },
          supervisorComments: { 'ui:widget': 'textarea' },
        }),
      },
    }),
    prisma.formTemplate.upsert({
      where: { key: FormTemplateKey.FINAL_EVAL },
      update: {},
      create: {
        key: FormTemplateKey.FINAL_EVAL,
        title: 'Final Evaluation',
        jsonSchema: JSON.stringify(evaluationSchema),
        uiSchema: JSON.stringify({
          competencies: {
            items: {
              competency: { 'ui:widget': 'textarea' },
              rating: { 'ui:widget': 'select' },
              comments: { 'ui:widget': 'textarea' },
            },
          },
          strengths: { 'ui:widget': 'textarea' },
          areasForImprovement: { 'ui:widget': 'textarea' },
          supervisorComments: { 'ui:widget': 'textarea' },
        }),
      },
    }),
  ])

  // Create form submissions
  const learningContractSubmission = await prisma.formSubmission.upsert({
    where: { id: 'form-submission-1' },
    update: {},
    create: {
      id: 'form-submission-1',
      templateId: formTemplates[0].id,
      placementId: placements[0].id,
      submittedBy: student1.id,
      role: FormSubmissionRole.STUDENT,
      data: JSON.stringify({
        learningGoals: [
          {
            goal: 'Develop clinical assessment skills',
            activities: 'Conduct intake interviews, complete assessments',
            evaluation: 'Supervisor observation and feedback',
          },
          {
            goal: 'Enhance group facilitation abilities',
            activities: 'Co-facilitate support groups, lead activities',
            evaluation: 'Peer and supervisor evaluation',
          },
        ],
        supervisionSchedule: 'Weekly individual supervision on Tuesdays at 2 PM',
        evaluationMethods: 'Direct observation, case review, self-assessment',
        studentSignature: 'Emily Chen',
        supervisorSignature: 'Michael Rodriguez',
        facultySignature: 'Dr. Sarah Johnson',
      }),
      status: FormSubmissionStatus.APPROVED,
      locked: true,
      approvedBy: faculty1.id,
    },
  })

  const midtermEvalSubmission = await prisma.formSubmission.upsert({
    where: { id: 'form-submission-2' },
    update: {},
    create: {
      id: 'form-submission-2',
      templateId: formTemplates[1].id,
      placementId: placements[0].id,
      submittedBy: supervisor1.id,
      role: FormSubmissionRole.SUPERVISOR,
      data: JSON.stringify({
        competencies: [
          {
            competency: 'Professional Communication',
            rating: 'Exceeds Expectations',
            comments: 'Excellent written and verbal communication skills',
          },
          {
            competency: 'Clinical Assessment',
            rating: 'Meets Expectations',
            comments: 'Shows good progress in assessment skills',
          },
        ],
        strengths: 'Strong interpersonal skills, eager to learn, punctual',
        areasForImprovement: 'Continue developing documentation skills',
        overallRating: 'Meets Expectations',
        supervisorComments: 'Student is making excellent progress',
      }),
      status: FormSubmissionStatus.DRAFT,
    },
  })

  console.log('✅ Seed completed successfully!')
  console.log('📧 Login credentials:')
  console.log('   Admin: admin@demo.edu / Passw0rd!')
  console.log('   Faculty: faculty1@demo.edu / Passw0rd!')
  console.log('   Faculty: mackenzie.reffitt@demo.edu / Passw0rd!')
  console.log('   Supervisor: supervisor1@demo.edu / Passw0rd!')
  console.log('   Student: student1@demo.edu / Passw0rd!')
  console.log('   Student: student2@demo.edu / Passw0rd!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
