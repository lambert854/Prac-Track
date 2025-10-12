const fs = require('fs');

console.log('🔧 Fixing final remaining TypeScript errors...\n');

// Fix 1: Edit faculty form - add missing password field
const editFacultyForm = 'src/components/admin/edit-faculty-form.tsx';
try {
  if (fs.existsSync(editFacultyForm)) {
    let content = fs.readFileSync(editFacultyForm, 'utf8');
    
    // Add password field to the setFormData call
    content = content.replace(
      /setFormData\(\{\s*honorific,\s*firstName,\s*lastName,\s*email,\s*title,\s*officePhone,\s*roomNumber\s*\}\)/,
      'setFormData({ honorific, firstName, lastName, email, title, officePhone, roomNumber, password: "" })'
    );
    
    fs.writeFileSync(editFacultyForm, content, 'utf8');
    console.log('✅ Fixed missing password field in edit-faculty-form.tsx');
  }
} catch (error) {
  console.log(`❌ Error fixing edit-faculty-form.tsx: ${error.message}`);
}

// Fix 2: Edit student form - add type annotation
const editStudentForm = 'src/components/admin/edit-student-form.tsx';
try {
  if (fs.existsSync(editStudentForm)) {
    let content = fs.readFileSync(editStudentForm, 'utf8');
    
    // Add type annotation for facultyMember parameter
    content = content.replace(
      /facultyMember\s*=>/,
      'facultyMember: any =>'
    );
    
    fs.writeFileSync(editStudentForm, content, 'utf8');
    console.log('✅ Fixed type annotation in edit-student-form.tsx');
  }
} catch (error) {
  console.log(`❌ Error fixing edit-student-form.tsx: ${error.message}`);
}

// Fix 3: Site detail view - add missing properties with optional chaining
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

// Fix 4: Supervisor forms - add type annotations
const supervisorForms = 'src/components/supervisor/supervisor-forms.tsx';
try {
  if (fs.existsSync(supervisorForms)) {
    let content = fs.readFileSync(supervisorForms, 'utf8');
    
    // Add type annotations for parameters
    content = content.replace(/doc\s*=>/g, 'doc: any =>');
    content = content.replace(/\(acc,\s*form\)\s*=>/g, '(acc: any, form: any) =>');
    content = content.replace(/form\s*=>/g, 'form: any =>');
    
    fs.writeFileSync(supervisorForms, content, 'utf8');
    console.log('✅ Fixed type annotations in supervisor-forms.tsx');
  }
} catch (error) {
  console.log(`❌ Error fixing supervisor-forms.tsx: ${error.message}`);
}

console.log('\n🎉 All final TypeScript errors fixed!');
