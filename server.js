// Zero-dependency static file server for Cloud Run.
// Serves the built ./dist and falls back to index.html (SPA routing).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, 'dist');
const PORT = process.env.PORT || 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

async function send(res, status, body, type = 'text/plain') {
  res.writeHead(status, { 'Content-Type': type });
  res.end(body);
}

const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    let filePath = normalize(join(ROOT, urlPath));
    if (!filePath.startsWith(ROOT)) return send(res, 403, 'Forbidden');

    let info = await stat(filePath).catch(() => null);
    if (info?.isDirectory()) {
      filePath = join(filePath, 'index.html');
      info = await stat(filePath).catch(() => null);
    }
    if (!info) {
      // SPA fallback
      filePath = join(ROOT, 'index.html');
    }
    const data = await readFile(filePath);
    const type = MIME[extname(filePath)] || 'application/octet-stream';
    const cache = filePath.includes(`${join('dist', 'assets')}`)
      ? 'public, max-age=31536000, immutable'
      : 'no-cache';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': cache });
    res.end(data);
  } catch (err) {
    send(res, 500, 'Internal error');
  }
});

server.listen(PORT, () => {
  console.log(`Clutch serving on :${PORT}`);
});
