const fs = require('fs');

// Files that need parameter fixes
const parameterFixFiles = [
  'src/app/api/admin/classes/[id]/route.ts',
  'src/app/api/admin/faculty-assignments/[id]/route.ts',
  'src/app/api/admin/faculty/[id]/route.ts',
  'src/app/api/admin/students/[id]/route.ts',
  'src/app/api/documents/template/[filename]/route.ts',
  'src/app/api/evaluations/submissions/[id]/unlock/route.ts',
  'src/app/api/faculty/[id]/dashboard/route.ts',
  'src/app/api/faculty/[id]/students/route.ts',
  'src/app/api/sites/[id]/approve/route.ts',
  'src/app/api/sites/[id]/final-approve/route.ts',
  'src/app/api/sites/[id]/reject/route.ts',
  'src/app/api/sites/[id]/route.ts',
  'src/app/api/students/[id]/dashboard/route.ts',
  'src/app/api/supervisor/[id]/dashboard/route.ts',
  'src/app/api/placements/[id]/route.ts',
  'src/app/api/placements/[id]/timesheets/route.ts'
];

// Files that need useState imports
const useStateFiles = [
  'src/components/admin/admin-reports.tsx',
  'src/components/dashboard/faculty-dashboard.tsx'
];

let totalFixed = 0;

console.log('🔧 Fixing remaining TypeScript errors...\n');

// Fix 1: Parameter naming issues
parameterFixFiles.forEach(filePath => {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fileFixed = 0;

    // Fix parameter destructuring
    content = content.replace(/{\s*params\s*}/g, '{ params: _params }');
    content = content.replace(/params\./g, '_params.');
    
    // Fix function parameter names
    content = content.replace(/\(request:\s*NextRequest\)/g, '(_request: NextRequest)');
    content = content.replace(/\brequest\./g, '_request.');

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

// Fix 2: Add missing useState imports
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

// Fix 3: Fix broken import in placements route
const placementsRoute = 'src/app/api/placements/route.ts';
try {
  if (fs.existsSync(placementsRoute)) {
    let content = fs.readFileSync(placementsRoute, 'utf8');
    let originalContent = content;
    
    // Fix the broken import
    content = content.replace(
      'requireFacultyOrAdminFacultyOrAdmin',
      'requireFacultyOrAdmin'
    );
    content = content.replace(
      'requireStudentFacultyOrAdmin',
      'requireStudentFacultyOrAdmin'
    );

    if (content !== originalContent) {
      fs.writeFileSync(placementsRoute, content, 'utf8');
      console.log(`✅ Fixed broken imports in ${placementsRoute}`);
      totalFixed++;
    }
  }
} catch (error) {
  console.log(`❌ Error processing ${placementsRoute}: ${error.message}`);
}

console.log(`\n🎉 Total fixes applied: ${totalFixed}`);
console.log('\n📋 Next steps:');
console.log('1. Run: npm run type-check');
console.log('2. The remaining errors are mostly Prisma type strictness issues');
console.log('3. Consider temporarily disabling exactOptionalPropertyTypes if needed');
