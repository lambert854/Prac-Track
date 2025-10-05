/**
 * Load Initial Sites Script - FIXED VERSION
 * 
 * This script loads field placement sites from the CSV file:
 * src/components/forms/SiteData/InitialSiteData.csv
 * 
 * Usage:
 *   node scripts/load-initial-sites.js
 * 
 * The script will:
 * - Parse the CSV file with proper handling of quoted fields
 * - Extract site information with correct column mapping
 * - Generate practice areas based on site names
 * - Create contact emails and phone numbers
 * - Parse agreement dates and calculate expiration dates
 * - Skip sites that already exist in the database
 * - Provide detailed logging of the import process
 * 
 * CSV Column Mapping (FIXED):
 * - Column 1: Site Name
 * - Column 2: Field Placement Agreement (Start Month/Year)
 * - Column 3: Contact Name
 * - Column 4: Staff w/ Active SW License
 * - Column 5: Field Supervisor Training Completed
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

// Practice areas mapping based on site name keywords
const practiceAreasMap = {
  'red cross': ['Crisis Intervention', 'Emergency Services', 'Community Outreach'],
  'birth': ['Child Development', 'Early Intervention', 'Family Services'],
  'hospital': ['Medical Social Work', 'Healthcare', 'Patient Advocacy'],
  'catholic': ['Community Services', 'Faith-based Services', 'Family Support'],
  'children': ['Child Welfare', 'Youth Services', 'Family Therapy', 'Child Advocacy'],
  'advocacy': ['Legal Advocacy', 'Victim Services', 'Social Justice'],
  'family': ['Family Services', 'Family Therapy', 'Parenting Support'],
  'home': ['Housing Services', 'Family Support', 'Community Services'],
  'connect': ['Community Development', 'Resource Coordination', 'Social Services'],
  'psychological': ['Mental Health', 'Therapy Services', 'Behavioral Health'],
  'law': ['Legal Services', 'Court Services', 'Legal Advocacy'],
  'care': ['Healthcare', 'Medical Social Work', 'Patient Services'],
  'choice': ['Healthcare', 'Medical Services', 'Patient Advocacy'],
  'healing': ['Mental Health', 'Trauma Services', 'Recovery Services'],
  'heart': ['Community Services', 'Faith-based Services', 'Family Support'],
  'jobs': ['Employment Services', 'Career Development', 'Workforce Services'],
  'school': ['School Social Work', 'Education Services', 'Youth Development'],
  'elementary': ['School Social Work', 'Child Development', 'Education Services'],
  'high school': ['School Social Work', 'Adolescent Services', 'Education Services'],
  'mental': ['Mental Health', 'Behavioral Health', 'Therapy Services'],
  'health': ['Healthcare', 'Medical Social Work', 'Public Health'],
  'community': ['Community Development', 'Social Services', 'Community Outreach'],
  'services': ['Social Services', 'Community Services', 'Support Services'],
  'center': ['Community Services', 'Resource Center', 'Social Services'],
  'clinic': ['Healthcare', 'Medical Services', 'Clinical Services'],
  'crisis': ['Crisis Intervention', 'Emergency Services', 'Trauma Services'],
  'recovery': ['Substance Abuse', 'Recovery Services', 'Mental Health'],
  'treatment': ['Mental Health', 'Substance Abuse', 'Therapy Services'],
  'therapy': ['Mental Health', 'Therapy Services', 'Behavioral Health'],
  'counseling': ['Mental Health', 'Counseling Services', 'Therapy Services'],
  'support': ['Support Services', 'Peer Support', 'Family Support'],
  'development': ['Community Development', 'Youth Development', 'Program Development'],
  'youth': ['Youth Services', 'Adolescent Services', 'Child Welfare'],
  'senior': ['Geriatric Services', 'Elder Care', 'Aging Services'],
  'elderly': ['Geriatric Services', 'Elder Care', 'Aging Services'],
  'veteran': ['Military Services', 'Veteran Services', 'Trauma Services'],
  'homeless': ['Housing Services', 'Homeless Services', 'Crisis Intervention'],
  'housing': ['Housing Services', 'Homeless Services', 'Community Development'],
  'disability': ['Disability Services', 'Accessibility Services', 'Support Services'],
  'autism': ['Developmental Disabilities', 'Autism Services', 'Family Support'],
  'addiction': ['Substance Abuse', 'Recovery Services', 'Mental Health'],
  'substance': ['Substance Abuse', 'Recovery Services', 'Mental Health'],
  'domestic': ['Domestic Violence', 'Victim Services', 'Legal Advocacy'],
  'violence': ['Domestic Violence', 'Trauma Services', 'Victim Services'],
  'abuse': ['Child Welfare', 'Domestic Violence', 'Trauma Services'],
  'foster': ['Child Welfare', 'Foster Care', 'Family Services'],
  'adoption': ['Adoption Services', 'Family Services', 'Child Welfare']
}

function generatePracticeAreas(siteName) {
  const name = siteName.toLowerCase()
  
  // Find matching keywords
  const matchedKeywords = []
  for (const [keyword, areas] of Object.entries(practiceAreasMap)) {
    if (name.includes(keyword)) {
      matchedKeywords.push(...areas)
    }
  }
  
  // Remove duplicates and limit to 3 areas
  const uniqueAreas = [...new Set(matchedKeywords)]
  
  // If no matches found, use default areas
  if (uniqueAreas.length === 0) {
    const defaultAreas = ['Community Services', 'Social Services', 'Support Services']
    return defaultAreas.slice(0, Math.floor(Math.random() * 3) + 1)
  }
  
  // Return up to 3 areas, randomly selected if more than 3
  if (uniqueAreas.length <= 3) {
    return uniqueAreas
  } else {
    const shuffled = uniqueAreas.sort(() => 0.5 - Math.random())
    return shuffled.slice(0, 3)
  }
}

function parseAgreementDate(agreementStr) {
  if (!agreementStr || agreementStr.trim() === '') {
    return null
  }
  
  // Parse formats like "9/2021", "1/2024", "8/2022"
  const parts = agreementStr.split('/')
  if (parts.length === 2) {
    const month = parseInt(parts[0])
    const year = parseInt(parts[1])
    
    if (month >= 1 && month <= 12 && year >= 2020 && year <= 2030) {
      // Create date for the 1st of the month
      return new Date(year, month - 1, 1)
    }
  }
  
  return null
}

function generateEmail(contactName, siteName) {
  if (!contactName || contactName.trim() === '' || contactName.toLowerCase().includes('need new contact')) {
    // Generate a generic email based on site name
    const siteEmail = siteName.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '.') // Replace spaces with dots
      .substring(0, 20) // Limit length
    
    return `${siteEmail}@example.org`
  }
  
  // Generate email from contact name
  const nameEmail = contactName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '.') // Replace spaces with dots
  
  return `${nameEmail}@example.org`
}

function generatePhone() {
  // Generate a random phone number in format (304) XXX-XXXX
  const areaCode = '304'
  const exchange = Math.floor(Math.random() * 900) + 100
  const number = Math.floor(Math.random() * 9000) + 1000
  
  return `(${areaCode}) ${exchange}-${number}`
}

// Improved CSV parser that handles quoted fields properly
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

async function loadInitialSitesFixed() {
  try {
    console.log('🚀 Starting to load initial sites data (FIXED VERSION)...')
    
    // Read the CSV file
    const csvPath = path.join(__dirname, '../src/components/forms/SiteData/InitialSiteData.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    
    // Parse CSV with better handling of quoted fields
    const lines = csvContent.split('\n')
    const header = lines[0].split(',')
    
    console.log('📊 CSV Header:', header)
    
    let sitesCreated = 0
    let sitesSkipped = 0
    let sitesWithErrors = 0
    
    // Process each line (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const columns = parseCSVLine(line)
      
      try {
        // Extract data from columns with CORRECTED mapping
        // Column 1 = Site Name
        // Column 2 = Field Placement Agreement
        // Column 3 = Contact Name
        // Column 4 = Staff w/ Active SW License
        // Column 5 = Field Supervisor Training
        
        const siteName = columns[1]?.trim()
        const agreementDate = columns[2]?.trim()
        const contactName = columns[3]?.trim()
        const hasActiveLicense = columns[4]?.trim().toLowerCase()
        const trainingCompleted = columns[5]?.trim()
        
        // Skip if no site name
        if (!siteName || siteName === '') {
          sitesSkipped++
          continue
        }
        
        // Check if site already exists
        const existingSite = await prisma.site.findFirst({
          where: { name: siteName }
        })
        
        if (existingSite) {
          console.log(`⚠️  Site "${siteName}" already exists, skipping...`)
          sitesSkipped++
          continue
        }
        
        // Generate practice areas based on site name
        const practiceAreas = generatePracticeAreas(siteName)
        
        // Parse agreement date
        const agreementStartDate = parseAgreementDate(agreementDate)
        
        // Generate contact information
        const contactEmail = generateEmail(contactName, siteName)
        const contactPhone = generatePhone()
        
        // Parse agreement date into month and year
        let agreementStartMonth = null
        let agreementStartYear = null
        if (agreementStartDate) {
          agreementStartMonth = agreementStartDate.getMonth() + 1 // JavaScript months are 0-based
          agreementStartYear = agreementStartDate.getFullYear()
        }

        // Create the site
        const site = await prisma.site.create({
          data: {
            name: siteName,
            address: 'Address not provided', // None listed as requested
            city: 'City not provided', // None as requested
            state: 'WV', // Default to West Virginia
            zip: '00000', // None as requested
            contactName: contactName || 'Contact not provided',
            contactEmail: contactEmail,
            contactPhone: contactPhone,
            practiceAreas: practiceAreas.join(', '),
            agreementExpirationDate: agreementStartDate ? new Date(agreementStartDate.getFullYear() + 3, agreementStartDate.getMonth(), agreementStartDate.getDate()) : null,
            agreementStartMonth: agreementStartMonth,
            agreementStartYear: agreementStartYear,
            staffHasActiveLicense: hasActiveLicense || 'Not specified',
            supervisorTraining: trainingCompleted || 'Not specified',
            active: true
          }
        })
        
        console.log(`✅ Created site: "${siteName}" (ID: ${site.id})`)
        console.log(`   - Contact: ${contactName || 'Not provided'}`)
        console.log(`   - Email: ${contactEmail}`)
        console.log(`   - Phone: ${contactPhone}`)
        console.log(`   - Practice Areas: ${practiceAreas.join(', ')}`)
        console.log(`   - Agreement: ${agreementDate || 'Not provided'}`)
        console.log(`   - Active License: ${hasActiveLicense || 'Not specified'}`)
        console.log(`   - Training Completed: ${trainingCompleted || 'Not specified'}`)
        console.log('')
        
        sitesCreated++
        
      } catch (error) {
        console.error(`❌ Error processing line ${i + 1}:`, error.message)
        console.error(`   Line data:`, columns)
        sitesWithErrors++
      }
    }
    
    console.log('🎉 Site loading completed!')
    console.log(`📊 Summary:`)
    console.log(`   - Sites created: ${sitesCreated}`)
    console.log(`   - Sites skipped: ${sitesSkipped}`)
    console.log(`   - Errors: ${sitesWithErrors}`)
    
    // Verify the data was loaded
    const totalSites = await prisma.site.count()
    console.log(`📈 Total sites in database: ${totalSites}`)
    
  } catch (error) {
    console.error('💥 Fatal error loading sites:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  loadInitialSitesFixed()
}

module.exports = { loadInitialSitesFixed }
