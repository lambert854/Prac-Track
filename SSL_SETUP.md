# SSL Setup for FieldTrack

## ⚠️ Security Warning
**This setup exposes your local development server to the internet. This is NOT recommended for production use.**

## Prerequisites
1. SSL certificates from GoDaddy for `www.thefieldtrack.com`
2. Router configured to forward port 443 to localhost:3000
3. Domain pointing to your public IP

## SSL Certificate Setup

### 1. Download Certificates from GoDaddy
Download these files from your GoDaddy SSL certificate:
- `thefieldtrack.key` (Private Key)
- `thefieldtrack_com.crt` (Certificate)
- `gd_bundle-g2-g1.crt` (Certificate Authority Bundle)

### 2. Place Certificates in SSL Directory
Put all three files in the `ssl/` directory:
```
fieldtrack/
├── ssl/
│   ├── thefieldtrack.key
│   ├── thefieldtrack_com.crt
│   └── gd_bundle-g2-g1.crt
├── server.js
└── package.json
```

### 3. Update Certificate Paths (if needed)
If your certificate filenames are different, update the paths in `server.js`:
```javascript
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'ssl', 'YOUR_KEY_FILE.key')),
  cert: fs.readFileSync(path.join(__dirname, 'ssl', 'YOUR_CERT_FILE.crt')),
  ca: fs.readFileSync(path.join(__dirname, 'ssl', 'YOUR_CA_BUNDLE.crt'))
};
```

## Running the HTTPS Server

### Start HTTPS Development Server
```bash
npm run dev:https
```

### Access Your Application
- **HTTPS Local:** https://localhost:3000
- **HTTPS Domain:** https://www.thefieldtrack.com:3000

## Router Configuration
Configure your router to:
1. Forward external port 443 (HTTPS) to internal port 3000
2. Forward external port 80 (HTTP) to internal port 3000 (optional)

## Troubleshooting

### Certificate Issues
- Ensure certificate files are in the correct format (PEM)
- Check file permissions (certificates should be readable)
- Verify certificate is valid for `www.thefieldtrack.com`

### Connection Issues
- Check router port forwarding settings
- Verify domain DNS is pointing to your public IP
- Ensure firewall allows connections on port 443

### Browser Warnings
- You may see certificate warnings in browsers
- This is normal for self-signed or development certificates
- Click "Advanced" → "Proceed to site" to continue

## Production Recommendation
For production use, deploy to:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **Railway**
- **Render**

These platforms provide:
- Automatic HTTPS
- Better security
- Scalability
- Professional hosting
