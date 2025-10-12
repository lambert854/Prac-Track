const fs = require('fs');

// Files that need parameter fixes
const filesToFix = [
  'src/app/api/admin/classes/[id]/route.ts',
  'src/app/api/admin/classes/route.ts',
  'src/app/api/admin/email-logs/route.ts',
  'src/app/api/admin/faculty-assignments/[id]/route.ts',
  'src/app/api/admin/faculty-assignments/route.ts',
  'src/app/api/admin/faculty/[id]/route.ts',
  'src/app/api/admin/faculty/route.ts',
  'src/app/api/admin/students/[id]/route.ts',
  'src/app/api/admin/students/route.ts',
  'src/app/api/admin/supervisors/route.ts',
  'src/app/api/documents/template/[filename]/route.ts',
  'src/app/api/evaluations/submissions/[id]/unlock/route.ts',
  'src/app/api/faculty/[id]/dashboard/route.ts',
  'src/app/api/faculty/[id]/students/route.ts',
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

console.log('🔧 Fixing parameter naming issues...\n');

filesToFix.forEach(filePath => {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fileFixed = 0;

    // Fix 1: Consistent parameter destructuring - use the original names
    content = content.replace(/{ params: _params }/g, '{ params }');
    content = content.replace(/\b_params\./g, 'params.');
    
    // Fix 2: Fix function parameter names - use original names
    content = content.replace(/\(_request:\s*NextRequest\)/g, '(request: NextRequest)');
    content = content.replace(/\b_request\./g, 'request.');

    // Fix 3: Fix broken import in placements route
    if (filePath === 'src/app/api/placements/route.ts') {
      content = content.replace(/requireStudentFacultyOrAdmin/g, 'requireFacultyOrAdmin');
    }

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed parameter issues in ${filePath}`);
      fileFixed++;
    }

    totalFixed += fileFixed;

  } catch (error) {
    console.log(`❌ Error processing ${filePath}: ${error.message}`);
  }
});

// Fix missing useState imports
const useStateFiles = [
  'src/components/admin/admin-reports.tsx',
  'src/components/dashboard/faculty-dashboard.tsx'
];

useStateFiles.forEach(filePath => {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fileFixed = 0;

    // Check if useState is used but not imported
    if (content.includes('useState(') && !content.includes('import { useState }')) {
      // Add import after 'use client' or at the top
      if (content.startsWith("'use client'")) {
        content = content.replace(
          "'use client'\n\n",
          "'use client'\n\nimport { useState } from 'react'\n"
        );
      } else {
        content = "import { useState } from 'react'\n" + content;
      }
      fileFixed++;
    }

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Added useState import to ${filePath}`);
    }

    totalFixed += fileFixed;

  } catch (error) {
    console.log(`❌ Error processing ${filePath}: ${error.message}`);
  }
});

console.log(`\n🎉 Total fixes applied: ${totalFixed}`);
