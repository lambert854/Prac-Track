const fs = require('fs');
const path = require('path');

// Common patterns to fix
const fixes = [
  // Remove unused imports
  {
    pattern: /import\s*{\s*([^}]+)\s*}\s*from\s*['"][^'"]+['"];?\s*\n/g,
    fix: (content, match, imports) => {
      // Check if imports are actually used in the file
      const usedImports = imports.split(',').map(imp => imp.trim()).filter(imp => {
        const importName = imp.split(' as ')[0].trim();
        return content.includes(importName) && !content.includes(`import.*${importName}`);
      });
      
      if (usedImports.length === 0) {
        return ''; // Remove the entire import line
      } else if (usedImports.length < imports.split(',').length) {
        return `import { ${usedImports.join(', ')} } from '${match.match(/from\s*['"]([^'"]+)['"]/)?.[1] || ''}';\n`;
      }
      return match;
    }
  },
  
  // Fix unused variables by prefixing with underscore
  {
    pattern: /(\w+):\s*(\w+)\s*=\s*await\s*getServerSession\(authOptions\)/g,
    fix: (match, varName, type) => {
      return `_${varName}: ${type} = await getServerSession(authOptions)`;
    }
  },
  
  // Fix unused parameters in function signatures
  {
    pattern: /\((\w+):\s*NextRequest\)/g,
    fix: (match, paramName) => {
      return `(_${paramName}: NextRequest)`;
    }
  },
  
  // Fix unused destructured parameters
  {
    pattern: /{\s*params\s*}\s*:\s*{\s*params:\s*Promise<{\s*id:\s*string\s*}\>\s*}/g,
    fix: () => {
      return '{ params: _params }: { params: Promise<{ id: string }> }';
    }
  }
];

// Files to process (from the error list)
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

console.log('🔧 Starting comprehensive TypeScript error fixes...\n');

filesToFix.forEach(filePath => {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fileFixed = 0;

    // Apply fixes
    fixes.forEach(({ pattern, fix }) => {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, fix);
        fileFixed += matches.length;
      }
    });

    // Additional specific fixes for common patterns
    // Remove unused getServerSession imports
    if (content.includes('getServerSession') && !content.match(/getServerSession\(/)) {
      content = content.replace(/import\s*{\s*getServerSession\s*}\s*from\s*['"]next-auth['"];?\s*\n/g, '');
      fileFixed++;
    }

    // Remove unused authOptions imports
    if (content.includes('authOptions') && !content.match(/authOptions\)/)) {
      content = content.replace(/import\s*{\s*authOptions\s*}\s*from\s*['"]@\/lib\/auth['"];?\s*\n/g, '');
      fileFixed++;
    }

    // Remove unused requireAdmin imports
    if (content.includes('requireAdmin') && !content.match(/requireAdmin\(/)) {
      content = content.replace(/requireAdmin,\s*/g, '');
      content = content.replace(/,\s*requireAdmin/g, '');
      fileFixed++;
    }

    // Fix unused variables by prefixing with underscore
    content = content.replace(/(\s+)(\w+):\s*(\w+)\s*=\s*await\s*getServerSession\(authOptions\)/g, '$1_$2: $3 = await getServerSession(authOptions)');
    content = content.replace(/(\s+)(\w+):\s*(\w+)\s*=\s*requireAdmin\(\)/g, '$1_$2: $3 = requireAdmin()');

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
