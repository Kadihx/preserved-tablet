'use strict';

const fs = require('fs');
const path = require('path');

const { TOKENS } = require('../diagram-engine/palette');

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function readGraphMeta(projectPath) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(projectPath, '.memory', 'graph-map.json'), 'utf8'));
    const fileCount = (data.nodes || []).filter((n) => n.type === 'file').length;
    const fnCount = (data.nodes || []).filter((n) => n.type === 'function').length;
    return { ...data.meta, fileCount, fnCount };
  } catch {
    return { status: 'unknown', lastSyncAt: null, fileCount: 0, fnCount: 0 };
  }
}

function hasDiagram(projectPath) {
  return fs.existsSync(path.join(projectPath, '.memory', 'diagram.svg'));
}

function renderProjectCard(project) {
  const meta = readGraphMeta(project.path);
  const statusLabel = { stub: 'henuz sync edilmedi', parsed: 'guncel', partial: 'kismi (parse hatasi var)', unknown: 'bilinmiyor' }[meta.status] || meta.status;
  const thumb = hasDiagram(project.path)
    ? `<img class="thumb" src="/projects/${project.id}/diagram.svg" alt="${escapeHtml(project.name)} diyagrami" loading="lazy" />`
    : `<div class="thumb thumb-empty">Henuz diyagram yok</div>`;

  return `<article class="card">
    <a class="thumb-link" href="/projects/${project.id}/view" target="_blank" rel="noopener">${thumb}</a>
    <div class="card-body">
      <h2>${escapeHtml(project.name)}</h2>
      <p class="path" title="${escapeHtml(project.path)}">${escapeHtml(project.path)}</p>
      <p class="stats">${meta.fileCount} dosya · ${meta.fnCount} fonksiyon · <span class="status status-${meta.status}">${escapeHtml(statusLabel)}</span></p>
      <div class="actions">
        <a class="btn" href="/projects/${project.id}/view" target="_blank" rel="noopener">Ac</a>
        <a class="btn btn-secondary" href="/projects/${project.id}/export" download>Disa aktar</a>
      </div>
    </div>
  </article>`;
}

function renderHome(projects) {
  const cards = projects.length
    ? projects.map(renderProjectCard).join('\n')
    : `<p class="empty">Henuz kayitli proje yok. Bir projede <code>npx preserved-tablet init</code> calistirdiginizda burada otomatik gorunecek.</p>`;

  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>The Preserved Tablet — Panel</title>
<style>
  :root {
    --surface: ${TOKENS.light.surface}; --page: ${TOKENS.light.pagePlane};
    --ink: ${TOKENS.light.primaryInk}; --ink2: ${TOKENS.light.secondaryInk}; --muted: ${TOKENS.light.mutedInk};
    --border: ${TOKENS.light.baseline};
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --surface: ${TOKENS.dark.surface}; --page: ${TOKENS.dark.pagePlane};
      --ink: ${TOKENS.dark.primaryInk}; --ink2: ${TOKENS.dark.secondaryInk}; --muted: ${TOKENS.dark.mutedInk};
      --border: ${TOKENS.dark.baseline};
    }
  }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 40px; background: var(--page); color: var(--ink); font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  p.subtitle { color: var(--ink2); font-size: 13px; margin: 0 0 32px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
  .thumb-link { display: block; }
  .thumb { width: 100%; height: 140px; object-fit: cover; object-position: top left; background: var(--page); display: block; }
  .thumb-empty { display: flex; align-items: center; justify-content: center; color: var(--muted); font-size: 12px; }
  .card-body { padding: 14px 16px 16px; }
  h2 { font-size: 14px; margin: 0 0 4px; }
  .path { font-size: 11px; color: var(--muted); margin: 0 0 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .stats { font-size: 12px; color: var(--ink2); margin: 0 0 12px; }
  .status-parsed { color: #1baf7a; }
  .status-stub { color: var(--muted); }
  .status-partial { color: #eda100; }
  .actions { display: flex; gap: 8px; }
  .btn { flex: 1; text-align: center; padding: 7px 10px; border-radius: 8px; border: 1px solid var(--border); color: var(--ink); text-decoration: none; font-size: 12.5px; }
  .btn-secondary { background: transparent; }
  .empty { color: var(--muted); font-size: 13px; }
  code { background: var(--page); border: 1px solid var(--border); border-radius: 4px; padding: 1px 5px; }
</style>
</head>
<body>
  <h1>The Preserved Tablet</h1>
  <p class="subtitle">${projects.length} kayitli proje — hepsi bu makinede local olarak calisiyor.</p>
  <div class="grid">
    ${cards}
  </div>
</body>
</html>
`;
}

module.exports = { renderHome };
