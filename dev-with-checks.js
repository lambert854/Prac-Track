#!/usr/bin/env node

const { execSync } = require('child_process');
const chalk = require('chalk');

console.log(chalk.blue('🔍 Running TypeScript and ESLint checks before starting dev server...'));

try {
  // Run type checking
  console.log(chalk.yellow('📝 Running TypeScript type checking...'));
  execSync('npm run type-check', { stdio: 'inherit' });
  console.log(chalk.green('✅ TypeScript checks passed!'));

  // Run linting
  console.log(chalk.yellow('🧹 Running ESLint...'));
  execSync('npm run lint', { stdio: 'inherit' });
  console.log(chalk.green('✅ ESLint checks passed!'));

  // Start dev server
  console.log(chalk.blue('🚀 Starting development server...'));
  execSync('npm run dev', { stdio: 'inherit' });

} catch (error) {
  console.log(chalk.red('❌ Pre-development checks failed!'));
  console.log(chalk.red('Please fix the issues above before starting development.'));
  process.exit(1);
}
