const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyImport() {
  try {
    const totalSites = await prisma.site.count();
    console.log(`Total sites in database: ${totalSites}`);
    
    const sampleSites = await prisma.site.findMany({
      take: 5,
      select: {
        name: true,
        agreementStartMonth: true,
        agreementStartYear: true,
        staffHasActiveLicense: true,
        supervisorTraining: true,
        agreementExpirationDate: true
      }
    });
    
    console.log('\nSample sites:');
    sampleSites.forEach(site => {
      const dateStr = site.agreementStartMonth ? `${site.agreementStartMonth}/${site.agreementStartYear}` : 'No date';
      const expirationStr = site.agreementExpirationDate ? new Date(site.agreementExpirationDate).toLocaleDateString() : 'No expiration';
      console.log(`- ${site.name}`);
      console.log(`  Start Date: ${dateStr}`);
      console.log(`  Expiration: ${expirationStr}`);
      console.log(`  Staff License: ${site.staffHasActiveLicense || 'Not specified'}`);
      console.log(`  Supervisor Training: ${site.supervisorTraining || 'Not specified'}`);
      console.log('');
    });
    
    // Count sites with different agreement statuses
    const sitesWithAgreements = await prisma.site.count({
      where: {
        agreementStartMonth: { not: null },
        agreementStartYear: { not: null }
      }
    });
    
    const sitesWithoutAgreements = await prisma.site.count({
      where: {
        OR: [
          { agreementStartMonth: null },
          { agreementStartYear: null }
        ]
      }
    });
    
    console.log(`Sites with agreements: ${sitesWithAgreements}`);
    console.log(`Sites without agreements: ${sitesWithoutAgreements}`);
    
  } catch (error) {
    console.error('Error verifying import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyImport();

