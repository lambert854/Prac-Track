const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

// Sample first and last names for random generation
const firstNames = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Sage', 'River',
  'Blake', 'Cameron', 'Drew', 'Emery', 'Finley', 'Hayden', 'Jamie', 'Kendall', 'Logan', 'Parker',
  'Reese', 'Skyler', 'Tatum', 'Valentine', 'Winter', 'Zion', 'Adrian', 'Brooklyn', 'Carson', 'Dakota',
  'Eden', 'Frankie', 'Gray', 'Harper', 'Indigo', 'Jules', 'Kai', 'Lane', 'Marlowe', 'Nico',
  'Ocean', 'Phoenix', 'Rowan', 'Sage', 'Tyler', 'Vale', 'Wren', 'Xander', 'Yael', 'Zara'
]

const lastNames = [
  'Anderson', 'Brown', 'Davis', 'Garcia', 'Johnson', 'Jones', 'Miller', 'Rodriguez', 'Smith', 'Taylor',
  'Thomas', 'Wilson', 'Martinez', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Moore', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams',
  'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts', 'Gomez', 'Phillips',
  'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris'
]

const terms = ['SPRING', 'FALL']
const cohorts = ['2025', '2026']

// Generate random A number (A000####)
function generateANumber() {
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `A000${randomNum}`
}

// Generate random email
function generateEmail(firstName, lastName) {
  const domains = ['student.edu', 'university.edu', 'college.edu', 'school.edu']
  const domain = domains[Math.floor(Math.random() * domains.length)]
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`
}

// Generate random password (8 characters)
function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

async function createDemoStudents() {
  try {
    console.log('🎓 Creating 25 demo students...\n')

    const students = []
    const usedANumbers = new Set()
    const usedEmails = new Set()

    // Generate 25 unique students
    for (let i = 0; i < 25; i++) {
      let firstName, lastName, aNumber, email, password
      
      // Ensure unique A numbers and emails
      do {
        firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
        lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
        aNumber = generateANumber()
        email = generateEmail(firstName, lastName)
      } while (usedANumbers.has(aNumber) || usedEmails.has(email))
      
      usedANumbers.add(aNumber)
      usedEmails.add(email)
      password = generatePassword()
      
      const term = terms[Math.floor(Math.random() * terms.length)]
      const cohort = cohorts[Math.floor(Math.random() * cohorts.length)]
      
      students.push({
        firstName,
        lastName,
        email,
        aNumber,
        password,
        term,
        cohort
      })
    }

    console.log('📋 Generated student data:')
    students.forEach((student, index) => {
      console.log(`${index + 1}. ${student.firstName} ${student.lastName}`)
      console.log(`   Email: ${student.email}`)
      console.log(`   A Number: ${student.aNumber}`)
      console.log(`   Password: ${student.password}`)
      console.log(`   Program: MSW, Cohort: ${student.cohort}, Term: ${student.term}`)
      console.log('')
    })

    // Create students in database
    console.log('💾 Creating students in database...')
    
    for (const studentData of students) {
      const hashedPassword = await bcrypt.hash(studentData.password, 12)
      
      const student = await prisma.user.create({
        data: {
          email: studentData.email,
          passwordHash: hashedPassword,
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          role: 'STUDENT',
          studentProfile: {
            create: {
              aNumber: studentData.aNumber,
              program: 'MSW',
              cohort: studentData.cohort
            }
          }
        },
        include: {
          studentProfile: true
        }
      })
      
      console.log(`✅ Created: ${student.firstName} ${student.lastName} (${student.studentProfile.aNumber})`)
    }

    console.log('\n🎉 Successfully created 25 demo students!')
    console.log('\n📊 Summary:')
    console.log(`   - Total students: 25`)
    console.log(`   - Program: MSW (all)`)
    console.log(`   - Required hours: 400 (all)`)
    console.log(`   - Cohorts: 2025, 2026`)
    console.log(`   - Terms: Spring, Fall`)
    console.log(`   - No placements assigned`)
    console.log(`   - No faculty assigned`)
    console.log(`   - Clean student records`)

  } catch (error) {
    console.error('❌ Error creating demo students:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createDemoStudents()
