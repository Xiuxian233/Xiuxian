import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { createServer } from 'node:http';

const root = resolve(process.argv.includes('--dist') ? 'dist' : '.');
const portFlagIndex = process.argv.indexOf('--port');
const port = Number(process.env.PORT || (portFlagIndex >= 0 ? process.argv[portFlagIndex + 1] : 5173));

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

function safePath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split('?')[0]);
  const normalizedPath = normalize(decodedPath).replace(/^([/\\])+/, '');
  const requestedPath = resolve(join(root, normalizedPath));
  return requestedPath.startsWith(root) ? requestedPath : join(root, 'index.html');
}

async function resolveFile(urlPath) {
  let filePath = safePath(urlPath);
  if (!existsSync(filePath)) return join(root, 'index.html');
  const fileStat = await stat(filePath);
  if (fileStat.isDirectory()) filePath = join(filePath, 'index.html');
  return filePath;
}

const server = createServer(async (request, response) => {
  try {
    const filePath = await resolveFile(request.url || '/');
    response.setHeader('Content-Type', mimeTypes[extname(filePath)] || 'application/octet-stream');
    createReadStream(filePath).pipe(response);
  } catch (error) {
    response.statusCode = 500;
    response.end(`Server error: ${error.message}`);
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Xiuxian app running at http://127.0.0.1:${port}`);
  console.log(`Serving ${root}`);
});
