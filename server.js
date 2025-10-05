const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// SSL Certificate paths (you'll need to update these)
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'ssl', 'thepractrack.key')),
  cert: fs.readFileSync(path.join(__dirname, 'ssl', 'thepractrack_com.crt')),
  ca: fs.readFileSync(path.join(__dirname, 'ssl', 'gd_bundle-g2-g1.crt'))
};

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on https://${hostname}:${port}`);
      console.log(`> Ready on https://www.thepractrack.com:${port}`);
    });
});
