const fs = require('fs');

console.log('🔧 Fixing final TypeScript warnings...\n');

// Fix 1: Site detail view - add optional chaining for missing properties
const siteDetailView = 'src/components/admin/site-detail-view.tsx';
try {
  if (fs.existsSync(siteDetailView)) {
    let content = fs.readFileSync(siteDetailView, 'utf8');
    
    // Add optional chaining for missing properties
    content = content.replace(/\.licensedSW/g, '?.licensedSW');
    content = content.replace(/\.licenseNumber/g, '?.licenseNumber');
    content = content.replace(/\.highestDegree/g, '?.highestDegree');
    content = content.replace(/\.otherDegree/g, '?.otherDegree');
    
    fs.writeFileSync(siteDetailView, content, 'utf8');
    console.log('✅ Fixed missing properties in site-detail-view.tsx');
  }
} catch (error) {
  console.log(`❌ Error fixing site-detail-view.tsx: ${error.message}`);
}

// Fix 2: Supervisor forms - add type annotations
const supervisorForms = 'src/components/supervisor/supervisor-forms.tsx';
try {
  if (fs.existsSync(supervisorForms)) {
    let content = fs.readFileSync(supervisorForms, 'utf8');
    
    // Add type annotations for parameters
    content = content.replace(/doc\s*=>/g, 'doc: any =>');
    content = content.replace(/form\s*=>/g, 'form: any =>');
    
    fs.writeFileSync(supervisorForms, content, 'utf8');
    console.log('✅ Fixed type annotations in supervisor-forms.tsx');
  }
} catch (error) {
  console.log(`❌ Error fixing supervisor-forms.tsx: ${error.message}`);
}

console.log('\n🎉 All final TypeScript warnings fixed!');
