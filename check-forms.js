const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkForms() {
  try {
    console.log('Checking form submissions...')

    const formSubmissions = await prisma.formSubmission.findMany({
      include: {
        template: true,
        placement: {
          include: {
            student: true
          }
        }
      }
    })

    console.log('Found form submissions:', formSubmissions.length)
    
    formSubmissions.forEach((form, index) => {
      console.log(`${index + 1}. ${form.template.title} - ${form.status} - Student: ${form.placement.student.firstName} ${form.placement.student.lastName}`)
    })

  } catch (error) {
    console.error('Error checking forms:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkForms()
