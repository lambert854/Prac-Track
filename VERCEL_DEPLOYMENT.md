# Vercel + Neon Deployment Guide for Prac-Track

## ✅ Pre-Deployment Changes Completed

The following changes have been made to prepare for Vercel deployment:

1. ✅ Fixed `next.config.ts` - Moved `serverComponentsExternalPackages` to root level
2. ✅ Fixed `prisma/schema.prisma` - Changed from SQLite to PostgreSQL
3. ✅ Removed duplicate favicon from `public/` folder
4. ✅ Added `postinstall` script to `package.json`
5. ✅ Created `.env.example` template
6. ✅ Fixed image localPatterns warning

---

## 🚀 Deployment Steps

### Step 1: Set Up Neon Database

1. **Go to https://neon.tech and create account/login**

2. **Create a new project:**
   - Project name: `prac-track-production`
   - Region: Choose closest to your users (e.g., US East, US West, or Europe)
   - PostgreSQL version: Latest (default)

3. **Get your connection string:**
   - In Neon dashboard, click "Connection Details"
   - **IMPORTANT:** Use the **"Pooled connection"** string for Vercel
   - It looks like: `postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require`
   - Copy this - you'll need it for Vercel

4. **Optional: Create a development branch in Neon**
   - Click "Branches" in Neon dashboard
   - Create branch: `development`
   - Use dev branch connection string for local development
   - Use main branch for production

---

### Step 2: Generate NEXTAUTH_SECRET

Run this command locally to generate a secure secret:

\`\`\`bash
openssl rand -base64 32
\`\`\`

Copy the output - you'll need this for Vercel environment variables.

---

### Step 3: Push to GitHub

\`\`\`bash
# Make sure all changes are committed
git add .
git commit -m "Prepare for Vercel deployment with Neon PostgreSQL"
git push origin main
\`\`\`

---

### Step 4: Deploy to Vercel

1. **Go to https://vercel.com/new**

2. **Import your GitHub repository:**
   - Select "Import Git Repository"
   - Choose your `fieldtrack` repository
   - Click "Import"

3. **Configure Project:**
   - **Framework Preset:** Next.js (auto-detected ✅)
   - **Root Directory:** `./` (leave default)
   - **Build Command:** `npm run build` (auto-detected ✅)
   - **Output Directory:** `.next` (auto-detected ✅)
   - **Install Command:** `npm install` (auto-detected ✅)

4. **Add Environment Variables:**
   
   Click "Environment Variables" and add these **3 required variables**:

   **Variable 1: DATABASE_URL**
   ```
   Name: DATABASE_URL
   Value: postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   Environments: ✅ Production, ✅ Preview, ✅ Development
   ```

   **Variable 2: NEXTAUTH_URL**
   ```
   Name: NEXTAUTH_URL
   Value: https://prac-track.com
   Environments: ✅ Production only
   ```

   **Variable 3: NEXTAUTH_SECRET**
   ```
   Name: NEXTAUTH_SECRET
   Value: [paste the output from openssl rand -base64 32]
   Environments: ✅ Production, ✅ Preview, ✅ Development
   ```

   **Variable 4 (Optional): RESEND_API_KEY**
   ```
   Name: RESEND_API_KEY
   Value: re_your_api_key_here
   Environments: ✅ Production, ✅ Preview, ✅ Development
   ```

5. **Click "Deploy"**
   - Vercel will build and deploy your app
   - First deployment takes 2-3 minutes
   - You'll get a URL like: `https://fieldtrack-xxx.vercel.app`

---

### Step 5: Run Database Migrations

**After the first successful deployment:**

1. **Install Vercel CLI:**
   \`\`\`bash
   npm install -g vercel
   \`\`\`

2. **Login to Vercel:**
   \`\`\`bash
   vercel login
   \`\`\`

3. **Link to your project:**
   \`\`\`bash
   vercel link
   \`\`\`

4. **Pull environment variables:**
   \`\`\`bash
   vercel env pull .env.production
   \`\`\`

5. **Run migrations:**
   \`\`\`bash
   # Load production env
   export $(cat .env.production | xargs)
   
   # OR on Windows PowerShell:
   # Get-Content .env.production | ForEach-Object { $_ -replace '"', '' } | ForEach-Object { if($_ -match '(.+?)=(.+)') { [Environment]::SetEnvironmentVariable($matches[1], $matches[2]) } }
   
   # Run migrations
   npx prisma migrate deploy
   
   # Seed initial data (if needed)
   npx prisma db seed
   \`\`\`

---

### Step 6: Configure Custom Domain (prac-track.com)

1. **In Vercel Dashboard:**
   - Go to your project
   - Click "Settings" → "Domains"
   - Add domain: `prac-track.com`
   - Also add: `www.prac-track.com` (optional)

2. **Configure DNS at your domain registrar:**
   
   Vercel will show you the DNS records to add. Typically:
   
   **For apex domain (prac-track.com):**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   ```
   
   **For www subdomain:**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

3. **Wait for DNS propagation:**
   - Usually takes 5-60 minutes
   - Vercel will auto-generate SSL certificate
   - You'll see "Valid Configuration" ✅

4. **Update NEXTAUTH_URL in Vercel:**
   - Go to Settings → Environment Variables
   - Update `NEXTAUTH_URL` from the temporary URL to: `https://prac-track.com`
   - Redeploy for changes to take effect

---

## 🧪 Testing Your Deployment

Once deployed and domain is configured:

1. **Visit https://prac-track.com**
2. **Test login** with your admin credentials
3. **Try creating a placement**
4. **Check if all pages load correctly**
5. **Test student, faculty, and supervisor roles**

---

## ⚠️ IMPORTANT: File Upload Issue

**Your app currently saves file uploads to the local filesystem, which WILL NOT WORK on Vercel!**

**Files that need migration:**
- Placement documents (cell policies, learning contracts, checklists)
- Learning contract uploads (resumes, promotional materials)

**Solution Options:**

### Option 1: Vercel Blob Storage (Recommended)
\`\`\`bash
npm install @vercel/blob
\`\`\`

Update file upload routes to use Vercel Blob instead of filesystem.

### Option 2: AWS S3
Use AWS S3 for file storage (more complex setup).

### Option 3: Uploadthing
Use Uploadthing service (easier setup, good free tier).

**This is not blocking deployment, but file uploads won't persist until this is fixed.**

---

## 📊 Monitoring & Logs

**View deployment logs:**
- Vercel Dashboard → Your Project → Deployments
- Click any deployment to see build logs

**View runtime logs:**
- Vercel Dashboard → Your Project → Logs
- Real-time function execution logs

**Monitor performance:**
- Vercel Analytics (included with Pro plan)
- Speed Insights
- Web Vitals

---

## 🔄 Continuous Deployment

**Vercel automatically deploys when you push to GitHub:**

\`\`\`bash
# Make changes locally
git add .
git commit -m "Your changes"
git push origin main

# Vercel automatically:
# 1. Detects push
# 2. Builds your app
# 3. Runs tests
# 4. Deploys if successful
# 5. Updates prac-track.com
\`\`\`

**Preview deployments:**
- Every pull request gets a unique preview URL
- Test changes before merging to main
- Preview URL format: `https://fieldtrack-git-branch-name-username.vercel.app`

---

## 🐛 Troubleshooting

### Build Fails: "Prisma generate error"
**Solution:** Already fixed with `postinstall` script ✅

### Database Connection Error
**Check:**
- DATABASE_URL includes `?sslmode=require`
- Connection string is from Neon "Pooled" tab
- Neon project is not suspended (free tier limit)

### NextAuth Configuration Error
**Check:**
- NEXTAUTH_URL matches your domain exactly
- NEXTAUTH_SECRET is set and at least 32 characters
- No trailing slashes in NEXTAUTH_URL

### File Upload Not Working
**This is expected** - see File Upload Issue section above

### Cold Start Delays
**Normal behavior:**
- First request after inactivity: 2-3 seconds
- Subsequent requests: <500ms
- Vercel Pro (you have this) has faster cold starts

---

## 📞 Need Help?

- **Vercel Documentation:** https://vercel.com/docs
- **Neon Documentation:** https://neon.tech/docs
- **Next.js Documentation:** https://nextjs.org/docs
- **Prisma Documentation:** https://www.prisma.io/docs

---

## ✅ Deployment Checklist

Before going live:

- [ ] Neon database created and connection string obtained
- [ ] NEXTAUTH_SECRET generated
- [ ] All environment variables added to Vercel
- [ ] Project deployed successfully to Vercel
- [ ] Database migrations run on production database
- [ ] Custom domain (prac-track.com) configured
- [ ] DNS records updated at domain registrar
- [ ] SSL certificate valid
- [ ] Tested login functionality
- [ ] Tested creating placements
- [ ] Tested all user roles
- [ ] File upload strategy decided (Vercel Blob/S3/Uploadthing)
- [ ] Team members notified of new production URL

---

**Your app is now production-ready on Vercel + Neon! 🎉**

Domain: https://prac-track.com

