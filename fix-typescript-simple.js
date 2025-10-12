const fs = require('fs');

// List of files with errors (from the terminal output)
const filesToFix = [
  'src/app/api/admin/classes/[id]/route.ts',
  'src/app/api/admin/classes/route.ts',
  'src/app/api/admin/dashboard/route.ts',
  'src/app/api/admin/email-logs/route.ts',
  'src/app/api/admin/faculty-assignments/[id]/route.ts',
  'src/app/api/admin/faculty-assignments/route.ts',
  'src/app/api/admin/faculty/[id]/route.ts',
  'src/app/api/admin/faculty/route.ts',
  'src/app/api/admin/reports/route.ts',
  'src/app/api/admin/reports/sites/route.ts',
  'src/app/api/admin/reports/students/route.ts',
  'src/app/api/admin/students/[id]/route.ts',
  'src/app/api/admin/students/route.ts',
  'src/app/api/admin/supervisors/route.ts',
  'src/app/api/admin/users/route.ts',
  'src/app/api/debug/session/route.ts',
  'src/app/api/documents/template/[filename]/route.ts',
  'src/app/api/evaluations/submissions/[id]/unlock/route.ts',
  'src/app/api/faculty/[id]/dashboard/route.ts',
  'src/app/api/faculty/[id]/students/route.ts',
  'src/app/api/notifications/mark-all-read/route.ts',
  'src/app/api/placements/[id]/route.ts',
  'src/app/api/placements/[id]/timesheets/route.ts',
  'src/app/api/placements/route.ts',
  'src/app/api/sites/[id]/approve/route.ts',
  'src/app/api/sites/[id]/final-approve/route.ts',
  'src/app/api/sites/[id]/reject/route.ts',
  'src/app/api/sites/[id]/route.ts',
  'src/app/api/sites/route.ts',
  'src/app/api/sites/send-learning-contract/route.ts',
  'src/app/api/sites/submit/route.ts',
  'src/app/api/students/[id]/dashboard/route.ts',
  'src/app/api/supervisor/[id]/dashboard/route.ts'
];

let totalFixed = 0;

console.log('🔧 Fixing TypeScript errors with simple approach...\n');

filesToFix.forEach(filePath => {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fileFixed = 0;

    // Fix 1: Remove unused getServerSession imports
    if (content.includes('import { getServerSession }') && !content.match(/getServerSession\(/)) {
      content = content.replace(/import\s*{\s*getServerSession\s*}\s*from\s*['"]next-auth['"];?\s*\n/g, '');
      fileFixed++;
    }

    // Fix 2: Remove unused authOptions imports
    if (content.includes('import { authOptions }') && !content.match(/authOptions\)/)) {
      content = content.replace(/import\s*{\s*authOptions\s*}\s*from\s*['"]@\/lib\/auth['"];?\s*\n/g, '');
      fileFixed++;
    }

    // Fix 3: Remove unused requireAdmin imports
    if (content.includes('requireAdmin') && !content.match(/requireAdmin\(/)) {
      content = content.replace(/requireAdmin,\s*/g, '');
      content = content.replace(/,\s*requireAdmin/g, '');
      fileFixed++;
    }

    // Fix 4: Remove unused requireStudent imports
    if (content.includes('requireStudent') && !content.match(/requireStudent\(/)) {
      content = content.replace(/requireStudent,\s*/g, '');
      content = content.replace(/,\s*requireStudent/g, '');
      fileFixed++;
    }

    // Fix 5: Remove unused requireFacultyOrAdmin imports
    if (content.includes('requireFacultyOrAdmin') && !content.match(/requireFacultyOrAdmin\(/)) {
      content = content.replace(/requireFacultyOrAdmin,\s*/g, '');
      content = content.replace(/,\s*requireFacultyOrAdmin/g, '');
      fileFixed++;
    }

    // Fix 6: Remove unused bcrypt imports
    if (content.includes('import bcrypt') && !content.match(/bcrypt\./)) {
      content = content.replace(/import\s+bcrypt\s+from\s+['"]bcryptjs['"];?\s*\n/g, '');
      fileFixed++;
    }

    // Fix 7: Remove unused canAccessStudentData imports
    if (content.includes('canAccessStudentData') && !content.match(/canAccessStudentData\(/)) {
      content = content.replace(/canAccessStudentData,\s*/g, '');
      content = content.replace(/,\s*canAccessStudentData/g, '');
      fileFixed++;
    }

    // Fix 8: Fix unused variables by prefixing with underscore
    content = content.replace(/(\s+)(\w+):\s*(\w+)\s*=\s*await\s*getServerSession\(authOptions\)/g, '$1_$2: $3 = await getServerSession(authOptions)');
    content = content.replace(/(\s+)(\w+):\s*(\w+)\s*=\s*requireAdmin\(\)/g, '$1_$2: $3 = requireAdmin()');

    // Fix 9: Fix unused parameters
    content = content.replace(/\((\w+):\s*NextRequest\)/g, '(_$1: NextRequest)');
    content = content.replace(/{\s*params\s*}/g, '{ params: _params }');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed ${fileFixed} issues in ${filePath}`);
      totalFixed += fileFixed;
    } else {
      console.log(`ℹ️  No issues found in ${filePath}`);
    }

  } catch (error) {
    console.log(`❌ Error processing ${filePath}: ${error.message}`);
  }
});

console.log(`\n🎉 Total fixes applied: ${totalFixed}`);
console.log('\n📋 Next steps:');
console.log('1. Run: npm run type-check');
console.log('2. Run: npm run lint:fix');
console.log('3. If errors remain, check specific files manually');
