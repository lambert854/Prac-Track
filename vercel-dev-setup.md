# Vercel Development Setup

## Option 1: Vercel Preview Deployments (Recommended)

### Benefits:
- ✅ Same environment as production
- ✅ No local port conflicts
- ✅ Automatic HTTPS
- ✅ Shareable URLs for testing
- ✅ No local environment issues

### Setup:
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Link your project:
   ```bash
   vercel link
   ```

4. For development with database changes:
   ```bash
   vercel dev
   ```

### Usage:
- `vercel dev` - Runs locally but with Vercel's environment
- `vercel` - Deploys a preview to Vercel
- `vercel --prod` - Deploys to production

## Option 2: GitHub Codespaces

### Benefits:
- ✅ Cloud-based VS Code environment
- ✅ Consistent environment every time
- ✅ No local setup issues
- ✅ Same as production environment

### Setup:
1. Go to your GitHub repo
2. Click "Code" → "Codespaces" → "Create codespace"
3. VSCode opens in browser
4. Run `npm run dev` - always works!

## Option 3: Keep Local but Fix Issues

Use the `start-dev-safe.ps1` or `start-dev-safe.bat` scripts I created above.
