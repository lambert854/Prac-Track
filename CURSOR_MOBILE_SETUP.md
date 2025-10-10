# Cursor Mobile Setup for FieldTrack

## 🚀 Quick Start

Your FieldTrack application is now configured for mobile development! Here's everything you need to know:

### Your Mobile Access URL
```
http://192.168.50.194:3000
```

## 📱 Setup Instructions

### 1. Start the Mobile Development Server
```bash
npm run dev:mobile
```

### 2. Connect from Cursor Mobile
1. **Open Cursor Mobile** on your device
2. **Ensure both devices are on the same WiFi network**
3. **Navigate to:** `http://192.168.50.194:3000`

## 🔧 Troubleshooting

### If you get a 500 error:
This is likely due to a Prisma database issue. Try these solutions:

#### Option 1: Restart the server
```bash
# Stop the current server (Ctrl+C)
npm run dev:mobile
```

#### Option 2: Reset the database
```bash
# Stop the server first
rm prisma/dev.db
npm run db:push
npm run db:seed
npm run dev:mobile
```

#### Option 3: Full reset (if needed)
```bash
# Stop the server first
rm -rf node_modules/.prisma
rm prisma/dev.db
npm install
npm run db:push
npm run db:seed
npm run dev:mobile
```

### If you can't connect from mobile:
1. **Check WiFi:** Ensure both devices are on the same network
2. **Check Firewall:** Windows Firewall might be blocking connections
3. **Try different port:** Edit `package.json` and change port from 3000 to 3001
4. **Check IP:** Run `ipconfig` to get your current IP address

## 🎯 What's Configured

### ✅ Mobile Development Features
- **Host binding:** Server accessible from any device on your network
- **CORS headers:** Proper cross-origin configuration
- **Mobile-optimized auth:** Session cookies configured for mobile
- **Development scripts:** Easy mobile development commands

### ✅ Available Scripts
- `npm run dev:mobile` - Start mobile development server
- `npm run setup:mobile:auto` - Automated setup (if Prisma works)
- `npm run db:studio` - Open database management interface

### ✅ Demo Data
The application includes demo users for testing:
- **Admin:** admin@demo.edu / Passw0rd!
- **Faculty:** faculty1@demo.edu / Passw0rd!
- **Supervisor:** supervisor1@demo.edu / Passw0rd!
- **Student:** student1@demo.edu / Passw0rd!

## 🔒 Security Note

This setup is for **development only**. The server binds to all network interfaces (0.0.0.0) making it accessible from any device on your network. Never use this configuration in production.

## 📋 Next Steps

1. **Start the server:** `npm run dev:mobile`
2. **Open Cursor Mobile** and navigate to your IP
3. **Test the login** with demo credentials
4. **Start developing** your mobile features!

## 🆘 Need Help?

If you encounter issues:
1. Check the server console for error messages
2. Verify your IP address with `ipconfig`
3. Ensure both devices are on the same WiFi
4. Try the troubleshooting steps above

Happy mobile development! 🎉
