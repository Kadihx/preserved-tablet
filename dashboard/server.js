'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const { listProjects, getProject } = require('../lib/registry');
const { renderHome } = require('./render');

const DEFAULT_PORT = 4317;
const MAX_PORT_ATTEMPTS = 10;

/**
 * Guvenlik/gizlilik: sadece 127.0.0.1'de dinler, ASLA 0.0.0.0'da degil.
 * Kullanici acikca "sadece tek-dosya export ile paylas" secenegini sectigi
 * icin bu panel yerel agdaki baska cihazlara acilmamali -- projelerinizin
 * dosya yollari ve kod mimarisi bilgisi disariya sizmamali.
 */
const HOST = '127.0.0.1';

function sendFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Dosya bulunamadi.');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function handleRequest(req, res) {
  const url = new URL(req.url, `http://${HOST}`);

  if (url.pathname === '/') {
    const projects = listProjects();
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderHome(projects));
    return;
  }

  // /projects/:id/(diagram.svg|view|export)
  const match = url.pathname.match(/^\/projects\/([a-f0-9]{10})\/(diagram\.svg|view|export)$/);
  if (match) {
    const [, id, action] = match;
    const project = getProject(id);
    if (!project) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Proje bulunamadi (silinmis veya tasinmis olabilir).');
      return;
    }

    const memoryDir = path.join(project.path, '.memory');

    if (action === 'diagram.svg') {
      sendFile(res, path.join(memoryDir, 'diagram.svg'), 'image/svg+xml');
      return;
    }
    if (action === 'view') {
      sendFile(res, path.join(memoryDir, 'diagram.html'), 'text/html; charset=utf-8');
      return;
    }
    if (action === 'export') {
      const filePath = path.join(memoryDir, 'diagram.html');
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Diyagram henuz uretilmemis -- once o projede "npx preserved-tablet sync" calistirin.');
          return;
        }
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="${project.name}-diagram.html"`,
        });
        res.end(data);
      });
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Bulunamadi.');
}

function openBrowser(url) {
  const cmd = process.platform === 'win32' ? `start "" "${url}"` : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
  exec(cmd, () => {}); // best-effort -- tarayici acilmazsa sessizce yut, kullanici linke elle tiklayabilir
}

/**
 * Port doluysa (EADDRINUSE) ayni server nesnesi uzerinde bir sonraki portu
 * dener. Dinleyiciler TEK SEFER kaydedilir (retry basina degil) -- aksi
 * halde her denemede yeni bir 'error' dinleyicisi eklenip ustuste yigilirdi.
 */
function startDashboard({ port = DEFAULT_PORT } = {}) {
  const server = http.createServer(handleRequest);
  let attempt = 0;

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attempt < MAX_PORT_ATTEMPTS) {
      attempt += 1;
      server.listen(port + attempt, HOST);
      return;
    }
    console.error('[preserved-tablet] dashboard baslatilamadi:', err.message);
    process.exitCode = 1;
  });

  server.on('listening', () => {
    const actualPort = server.address().port;
    const url = `http://${HOST}:${actualPort}`;
    console.log(`[preserved-tablet] Panel calisiyor: ${url}`);
    console.log('[preserved-tablet] Durdurmak icin Ctrl+C.');
    openBrowser(url);
  });

  server.listen(port, HOST);
  return server;
}

module.exports = { startDashboard };
