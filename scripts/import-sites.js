const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Complete site data from the Excel file - Column mapping:
// Column B: Site Name
// Column C: Field Placement Agreement Start Date (Month/Year)
// Column D: Contact Name  
// Column E: Staff with Active SW License (Yes/No)
// Column F: Field Supervisor Training (Yes/No)

const sitesData = [
  { name: "American Red Cross", startDate: "9/2021", contactName: "Pat Booker", staffLicense: "yes", supervisorTraining: "" },
  { name: "Birth to Three", startDate: "1/2024", contactName: "Lorinda McCain", staffLicense: "yes", supervisorTraining: "" },
  { name: "CAMC Teays Valley", startDate: "8/2022", contactName: "Kelly Tinsley", staffLicense: "yes", supervisorTraining: "" },
  { name: "Catholic Charities", startDate: "8/2023", contactName: "Maureen Runyon", staffLicense: "", supervisorTraining: "" },
  { name: "Children's Advocacy Center", startDate: "8/2021", contactName: "Miranda Dunlap", staffLicense: "yes", supervisorTraining: "" },
  { name: "KCS - Alban Elementary", startDate: "9/2021", contactName: "Jena Cory", staffLicense: "yes", supervisorTraining: "" },
  { name: "Thomas Health", startDate: "8/2021", contactName: "Kristina Moore", staffLicense: "yes", supervisorTraining: "" },
  { name: "WV State Police", startDate: "9/2021", contactName: "Avery tilley", staffLicense: "yes", supervisorTraining: "" },
  { name: "Connect CCR & R", startDate: "8/2021", contactName: "need new contact", staffLicense: "", supervisorTraining: "" },
  { name: "Synergy Health", startDate: "8/2021", contactName: "need new contact", staffLicense: "", supervisorTraining: "" },
  { name: "WVSU Office of International Affairs", startDate: "8/2021", contactName: "need new contact", staffLicense: "", supervisorTraining: "" },
  { name: "Eastbrook Center, LLC", startDate: "", contactName: "", staffLicense: "", supervisorTraining: "" },
  { name: "Necco", startDate: "", contactName: "", staffLicense: "", supervisorTraining: "" },
  { name: "CAMC General", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "CAMC Women and Children's", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Charleston Area Medical Center", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Community Health Network", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "FamilyCare Health Centers", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Kanawha County Schools - Various", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Marshall Health", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Mon Health System", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Putnam County Schools", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Raleigh General Hospital", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "St. Mary's Medical Center", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "United Hospital Center", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Valley Health Systems", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "WV Department of Health and Human Resources", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "WV Department of Veterans Affairs", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "WVU Medicine", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Cabell County Schools", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Clay County Schools", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Fayette County Schools", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Jackson County Schools", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Kanawha County Schools - Central Office", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Lincoln County Schools", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Logan County Schools", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Mason County Schools", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Mingo County Schools", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Nicholas County Schools", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Pocahontas County Schools", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Raleigh County Schools", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Randolph County Schools", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Roane County Schools", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Summers County Schools", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Upshur County Schools", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Wayne County Schools", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Webster County Schools", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Wood County Schools", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Wyoming County Schools", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Boone County Schools", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Braxton County Schools", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Calhoun County Schools", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" },
  { name: "Gilmer County Schools", startDate: "8/2021", contactName: "need new contact", staffLicense: "yes", supervisorTraining: "" }
];

// Helper function to parse date and calculate expiration
function parseDateAndExpiration(dateString) {
  if (!dateString || dateString.trim() === "") {
    return { startMonth: null, startYear: null, expirationDate: null };
  }
  
  // Handle different date formats
  let month, year;
  
  if (dateString.includes("/")) {
    const parts = dateString.split("/");
    if (parts.length >= 2) {
      month = parseInt(parts[0]);
      year = parseInt(parts[1]);
      
      // Handle 2-digit years
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }
    }
  }
  
  if (!month || !year || isNaN(month) || isNaN(year)) {
    return { startMonth: null, startYear: null, expirationDate: null };
  }
  
  // Calculate expiration date (3 years from start)
  const startDate = new Date(year, month - 1, 1);
  const expirationDate = new Date(startDate);
  expirationDate.setFullYear(startDate.getFullYear() + 3);
  
  return {
    startMonth: month,
    startYear: year,
    expirationDate: expirationDate.toISOString()
  };
}

// Helper function to normalize license and training values
function normalizeYesNo(value) {
  if (!value || value.trim() === "") {
    return null;
  }
  
  const normalized = value.toLowerCase().trim();
  if (normalized === "yes" || normalized === "y") {
    return "YES";
  } else if (normalized === "no" || normalized === "n") {
    return "NO";
  }
  
  return null;
}

async function cleanupAndImport() {
  try {
    console.log("Starting data cleanup and import...");
    
    // Step 1: Delete all existing supervisors
    console.log("Deleting existing supervisors...");
    await prisma.supervisorProfile.deleteMany({});
    
    // Step 2: Delete all existing placements
    console.log("Deleting existing placements...");
    await prisma.placement.deleteMany({});
    
    // Step 3: Delete all existing sites
    console.log("Deleting existing sites...");
    await prisma.site.deleteMany({});
    
    console.log("Cleanup completed. Starting import...");
    
    // Step 4: Import new sites
    let importedCount = 0;
    
    for (const siteData of sitesData) {
      if (!siteData.name || siteData.name.trim() === "") {
        continue; // Skip empty rows
      }
      
      const { startMonth, startYear, expirationDate } = parseDateAndExpiration(siteData.startDate);
      
      const siteToCreate = {
        name: siteData.name.trim(),
        address: "Address not provided", // Default since not in Excel
        city: "City not provided", // Default since not in Excel
        state: "State not provided", // Default since not in Excel
        zip: "00000", // Default since not in Excel
        contactName: siteData.contactName && siteData.contactName.trim() !== "" ? siteData.contactName.trim() : "Contact not provided",
        contactEmail: "contact@example.com", // Default since not in Excel
        contactPhone: "Phone not provided", // Default since not in Excel
        practiceAreas: "Practice areas not specified", // Default since not in Excel
        active: true,
        agreementStartMonth: startMonth,
        agreementStartYear: startYear,
        agreementExpirationDate: expirationDate,
        staffHasActiveLicense: normalizeYesNo(siteData.staffLicense),
        supervisorTraining: normalizeYesNo(siteData.supervisorTraining)
      };
      
      await prisma.site.create({
        data: siteToCreate
      });
      
      importedCount++;
      console.log(`Imported: ${siteData.name}`);
    }
    
    console.log(`\nImport completed successfully!`);
    console.log(`Total sites imported: ${importedCount}`);
    
  } catch (error) {
    console.error("Error during import:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
cleanupAndImport()
  .then(() => {
    console.log("Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
