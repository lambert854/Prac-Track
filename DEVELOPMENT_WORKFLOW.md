# Prac-Track Development Workflow

## 🚀 Daily Development

### Option 1: Vercel Dev (Recommended)
```bash
vercel dev
```
- ✅ Same environment as production
- ✅ No port conflicts
- ✅ Automatic environment variables
- ✅ Access at http://localhost:3001 (or whatever port Vercel assigns)

### Option 2: Local Development
```bash
# Use the safe scripts we created
.\start-dev-safe.ps1    # PowerShell
# or
start-dev-safe.bat      # Command Prompt
```

## 📤 Deployment Process

### Automatic Deployment (Current Setup)
1. **Make your changes** in your code
2. **Commit and push:**
   ```bash
   git add .
   git commit -m "Description of your changes"
   git push origin main
   ```
3. **Vercel automatically:**
   - Builds your app
   - Runs TypeScript checks
   - Runs ESLint checks
   - Deploys to production
   - Sends you deployment URL

### Manual Deployment (Optional)
```bash
vercel --prod
```

## 🔧 Environment Management

### Production Environment
- Managed by Vercel
- Uses environment variables from Vercel dashboard
- Database: Neon PostgreSQL (production)
- Authentication: Production secrets

### Development Environment
- `vercel dev` uses Vercel's environment
- Local `.env.local` for local overrides
- Same database as production (or local if needed)

## 📊 What Happens on Git Push

1. **Vercel detects push to `main`**
2. **Runs build process:**
   - `npm install`
   - `prisma generate`
   - `next build`
   - TypeScript check
   - ESLint check
3. **Deploys to production**
4. **Sends deployment notification**

## 🎯 Best Practices

### Before Pushing
```bash
# Test locally first
vercel dev

# Or run checks manually
npm run type-check
npm run lint
npm run build
```

### Branch Strategy
- `main` branch = Production
- Feature branches = Development/Testing
- Push to `main` = Auto-deploy to production

## 🚨 If Something Goes Wrong

### Rollback
- Go to Vercel dashboard
- Click on your deployment
- Click "Promote" on a previous working deployment

### Debug Production Issues
- Check Vercel function logs
- Use `vercel logs` command
- Check environment variables in Vercel dashboard
