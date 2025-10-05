const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function removeDuplicateForm() {
  try {
    console.log('Removing duplicate midterm evaluation form...')

    // Find all midterm evaluation forms in DRAFT status
    const midtermForms = await prisma.formSubmission.findMany({
      where: {
        template: {
          key: 'MIDTERM_EVAL'
        },
        status: 'DRAFT'
      },
      include: {
        template: true,
        placement: {
          include: {
            student: true
          }
        }
      }
    })

    console.log(`Found ${midtermForms.length} midterm evaluation forms in DRAFT status`)

    if (midtermForms.length > 1) {
      // Keep the first one, delete the rest
      const toDelete = midtermForms.slice(1)
      
      for (const form of toDelete) {
        console.log(`Deleting duplicate form: ${form.id}`)
        await prisma.formSubmission.delete({
          where: { id: form.id }
        })
      }
      
      console.log(`Deleted ${toDelete.length} duplicate form(s)`)
    } else {
      console.log('No duplicates found')
    }

  } catch (error) {
    console.error('Error removing duplicate form:', error)
  } finally {
    await prisma.$disconnect()
  }
}

removeDuplicateForm()
