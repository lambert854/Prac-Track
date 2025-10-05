const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addDemoMidterm() {
  try {
    console.log('Adding demo midterm evaluation...')

    // Get the first student and their active placement
    const student = await prisma.user.findFirst({
      where: { role: 'STUDENT' },
      include: {
        studentProfile: true
      }
    })

    if (!student) {
      console.log('No student found')
      return
    }

    const placement = await prisma.placement.findFirst({
      where: {
        studentId: student.id,
        status: 'ACTIVE'
      }
    })

    if (!placement) {
      console.log('No active placement found for student')
      return
    }

    // Get or create the midterm evaluation template
    let template = await prisma.formTemplate.findUnique({
      where: { key: 'MIDTERM_EVAL' }
    })

    if (!template) {
      template = await prisma.formTemplate.create({
        data: {
          key: 'MIDTERM_EVAL',
          title: 'Midterm Evaluation',
          jsonSchema: JSON.stringify({
            type: 'object',
            properties: {
              studentReflection: {
                type: 'string',
                title: 'Student Self-Reflection',
                description: 'Please reflect on your field placement experience so far'
              },
              learningObjectives: {
                type: 'string',
                title: 'Learning Objectives Progress',
                description: 'Describe your progress toward learning objectives'
              },
              challenges: {
                type: 'string',
                title: 'Challenges and Growth',
                description: 'What challenges have you faced and how have you grown?'
              },
              goals: {
                type: 'string',
                title: 'Remaining Goals',
                description: 'What are your goals for the remainder of the placement?'
              }
            },
            required: ['studentReflection', 'learningObjectives', 'challenges', 'goals']
          }),
          uiSchema: JSON.stringify({
            studentReflection: {
              'ui:widget': 'textarea',
              'ui:options': {
                rows: 4
              }
            },
            learningObjectives: {
              'ui:widget': 'textarea',
              'ui:options': {
                rows: 4
              }
            },
            challenges: {
              'ui:widget': 'textarea',
              'ui:options': {
                rows: 4
              }
            },
            goals: {
              'ui:widget': 'textarea',
              'ui:options': {
                rows: 4
              }
            }
          })
        }
      })
      console.log('Created midterm evaluation template')
    }

    // Create a draft form submission for the student
    const formSubmission = await prisma.formSubmission.create({
      data: {
        templateId: template.id,
        placementId: placement.id,
        submittedBy: student.id,
        role: 'STUDENT',
        status: 'DRAFT',
        data: JSON.stringify({
          studentReflection: '',
          learningObjectives: '',
          challenges: '',
          goals: ''
        }),
        locked: false
      }
    })

    console.log('Created demo midterm evaluation form submission:', formSubmission.id)
    console.log('Student can now complete the midterm evaluation!')

  } catch (error) {
    console.error('Error adding demo midterm:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addDemoMidterm()
