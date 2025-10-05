/**
 * Load Demo Students Script
 * 
 * This script creates 45 demo students with random data:
 * - Random first names and last names
 * - Random email addresses
 * - Random A000#### numbers
 * - Random passwords (hashed)
 * - Program: BSW for everyone
 * - Random cohorts: 2025, 2026, 2027, 2028
 * - No faculty assignments
 * 
 * Usage:
 *   node scripts/load-demo-students.js
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// Arrays of first and last names for random generation
const firstNames = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'William', 'Sophia', 'James', 'Isabella', 'Benjamin',
  'Charlotte', 'Lucas', 'Amelia', 'Henry', 'Mia', 'Alexander', 'Harper', 'Mason', 'Evelyn', 'Michael',
  'Abigail', 'Ethan', 'Emily', 'Daniel', 'Elizabeth', 'Jacob', 'Sofia', 'Logan', 'Avery', 'Jackson',
  'Ella', 'Levi', 'Madison', 'Sebastian', 'Scarlett', 'Mateo', 'Victoria', 'Jack', 'Aria', 'Owen',
  'Grace', 'Theodore', 'Chloe', 'Aiden', 'Camila', 'Samuel', 'Penelope', 'Joseph', 'Riley', 'John',
  'Layla', 'David', 'Lillian', 'Wyatt', 'Nora', 'Matthew', 'Zoey', 'Luke', 'Mila', 'Asher',
  'Aubrey', 'Carter', 'Hannah', 'Julian', 'Lily', 'Grayson', 'Addison', 'Leo', 'Eleanor', 'Jayden',
  'Natalie', 'Gabriel', 'Luna', 'Isaac', 'Savannah', 'Oliver', 'Brooklyn', 'Jonathan', 'Leah', 'Bentley'
]

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
  'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
  'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson'
]

// Cohort years
const cohortYears = [2025, 2026, 2027, 2028]

function generateRandomName() {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
  return { firstName, lastName }
}

function generateRandomEmail(firstName, lastName) {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'student.edu']
  const domain = domains[Math.floor(Math.random() * domains.length)]
  
  // Sometimes add numbers or variations
  const variations = [
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}${Math.floor(Math.random() * 99) + 1}`,
    `${lastName.toLowerCase()}${firstName.toLowerCase()}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 99) + 1}`
  ]
  
  const emailBase = variations[Math.floor(Math.random() * variations.length)]
  return `${emailBase}@${domain}`
}

function generateRandomANumber() {
  const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `A000${randomNum}`
}

function generateRandomPassword() {
  const passwords = [
    'Student123!', 'Demo2024!', 'Password1!', 'Test123!', 'Demo123!',
    'Student2024!', 'Test2024!', 'Demo2025!', 'Student1!', 'Test1!',
    'Password123!', 'Demo2025!', 'Student2025!', 'Test2025!', 'Demo2026!'
  ]
  return passwords[Math.floor(Math.random() * passwords.length)]
}

function generateRandomCohort() {
  return cohortYears[Math.floor(Math.random() * cohortYears.length)]
}

async function loadDemoStudents() {
  try {
    console.log('🚀 Starting to load demo students...')
    
    let studentsCreated = 0
    let studentsSkipped = 0
    let studentsWithErrors = 0
    
    // Generate 45 students
    for (let i = 1; i <= 45; i++) {
      try {
        const { firstName, lastName } = generateRandomName()
        const email = generateRandomEmail(firstName, lastName)
        const aNumber = generateRandomANumber()
        const password = generateRandomPassword()
        const cohort = generateRandomCohort()
        
        // Check if student already exists (by email or A-number)
        const existingStudent = await prisma.user.findFirst({
          where: {
            OR: [
              { email: email },
              { studentProfile: { aNumber: aNumber } }
            ]
          }
        })
        
        if (existingStudent) {
          console.log(`⚠️  Student with email "${email}" or A-number "${aNumber}" already exists, skipping...`)
          studentsSkipped++
          continue
        }
        
        // Hash the password
        const passwordHash = await bcrypt.hash(password, 12)
        
        // Create the student
        const student = await prisma.user.create({
          data: {
            email: email,
            passwordHash: passwordHash,
            role: 'STUDENT',
            firstName: firstName,
            lastName: lastName,
            active: true,
            studentProfile: {
              create: {
                aNumber: aNumber,
                program: 'BSW',
                cohort: cohort.toString()
              }
            }
          },
          include: {
            studentProfile: true
          }
        })
        
        console.log(`✅ Created student ${i}/45: ${firstName} ${lastName} (ID: ${student.id})`)
        console.log(`   - Email: ${email}`)
        console.log(`   - A-Number: ${aNumber}`)
        console.log(`   - Password: ${password}`)
        console.log(`   - Program: BSW`)
        console.log(`   - Cohort: ${cohort}`)
        console.log('')
        
        studentsCreated++
        
      } catch (error) {
        console.error(`❌ Error creating student ${i}:`, error.message)
        studentsWithErrors++
      }
    }
    
    console.log('🎉 Demo student loading completed!')
    console.log(`📊 Summary:`)
    console.log(`   - Students created: ${studentsCreated}`)
    console.log(`   - Students skipped: ${studentsSkipped}`)
    console.log(`   - Errors: ${studentsWithErrors}`)
    
    // Verify the data was loaded
    const totalStudents = await prisma.user.count({
      where: { role: 'STUDENT' }
    })
    console.log(`📈 Total students in database: ${totalStudents}`)
    
    // Show some sample students
    const sampleStudents = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: { studentProfile: true },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })
    
    console.log('\n📋 Sample students created:')
    sampleStudents.forEach((student, index) => {
      console.log(`${index + 1}. ${student.firstName} ${student.lastName}`)
      console.log(`   Email: ${student.email}`)
      console.log(`   A-Number: ${student.studentProfile?.aNumber}`)
      console.log(`   Program: ${student.studentProfile?.program}`)
      console.log(`   Cohort: ${student.studentProfile?.cohort}`)
    })
    
  } catch (error) {
    console.error('💥 Fatal error loading demo students:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  loadDemoStudents()
}

module.exports = { loadDemoStudents }
