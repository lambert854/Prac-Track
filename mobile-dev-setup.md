# Mobile Development Setup for FieldTrack

This guide will help you set up FieldTrack for mobile development with Cursor Mobile.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Cursor Mobile** app installed on your device
4. **Same WiFi network** for your computer and mobile device

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Environment Variables
Create a `.env.local` file in the root directory with:
```env
NEXTAUTH_URL=http://YOUR_COMPUTER_IP:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production
DATABASE_URL="file:./dev.db"
RESEND_API_KEY=your-resend-api-key-here
NODE_ENV=development
```

### 3. Set up Database
```bash
npm run setup:mobile
```

### 4. Start Mobile Development Server
```bash
npm run dev:mobile
```

## Finding Your Computer's IP Address

### Windows:
```cmd
ipconfig
```
Look for "IPv4 Address" under your WiFi adapter.

### macOS/Linux:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

## Accessing from Mobile

1. **Start the development server:**
   ```bash
   npm run dev:mobile
   ```

2. **Find your computer's IP address** (see above)

3. **Open Cursor Mobile** and connect to:
   ```
   http://YOUR_COMPUTER_IP:3000
   ```

## Troubleshooting

### Connection Issues
- Ensure both devices are on the same WiFi network
- Check Windows Firewall settings
- Try disabling antivirus temporarily

### Database Issues
- Run `npm run db:push` to sync database schema
- Run `npm run db:seed` to populate with demo data

### Port Issues
- If port 3000 is busy, change it in package.json scripts
- Update NEXTAUTH_URL accordingly

## Development Scripts

- `npm run dev:mobile` - Start development server for mobile access
- `npm run setup:mobile` - Complete mobile setup (database + seed)
- `npm run db:studio` - Open Prisma Studio for database management
- `npm run dev` - Regular development server (localhost only)

## Security Note

This setup is for development only. The server binds to all interfaces (0.0.0.0) which makes it accessible from any device on your network. Never use this configuration in production.

## Demo Users

After running `npm run db:seed`, you can log in with:

**Admin:**
- Email: admin@example.com
- Password: admin123

**Student:**
- Email: student@example.com
- Password: student123

**Faculty:**
- Email: faculty@example.com
- Password: faculty123

**Supervisor:**
- Email: supervisor@example.com
- Password: supervisor123
