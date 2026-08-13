'use strict';

const fs = require('fs/promises');
const path = require('path');

const { TOKENS, colorForGroupIndex, OTHER_GROUP } = require('./palette');

const BOX_W = 220;
const BOX_H = 64;
const COL_GAP = 90;
const ROW_GAP = 18;
const MARGIN = 48;
const HEADER_H = 40;
const MAX_GROUPS_COLORED = 8;

function escapeXml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/**
 * Gercek metin genisligi olcumu (canvas/tarayici) burada mevcut degil, bu
 * yuzden karakter sayisina dayali muhafazakar bir kesme uyguluyoruz. Kutu
 * genisliklerini asip komsu dugumlerin uzerine binmesini onlemek icin --
 * "editoryal kalite" vaadinin bir parcasi olarak metin tasmasi kabul edilmez.
 */
function truncate(str, maxChars) {
  if (str.length <= maxChars) return str;
  return `${str.slice(0, maxChars - 1)}…`;
}

/**
 * Dosya dugumlerini ust-duzey dizinlerine gore gruplar. Diyagram bilinçli
 * olarak sadece 'file' turundeki dugumleri gosterir -- 'function'/'class'
 * dugumleri (graph-map.json'da mevcut, Claude'un ince taneli kullanimi icin)
 * gorsel karmasa yaratmamak adina kutu icinde sadece bir sayac olarak ozetlenir.
 */
function groupFiles(fileNodes) {
  const groups = new Map();
  for (const node of fileNodes) {
    const key = node.dir || '(kok)';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(node);
  }
  // Alfabetik sira: ayni proje icin tekrar uretimlerde grup->renk eslesmesi stabil kalir.
  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([dir, files]) => ({ dir, files: files.sort((a, b) => a.name.localeCompare(b.name)) }));
}

function computeLayout(graphData) {
  const fileNodes = graphData.nodes.filter((n) => n.type === 'file');
  const groups = groupFiles(fileNodes);

  const positions = new Map();
  let x = MARGIN;
  let maxRows = 0;

  const columns = groups.map((group, groupIndex) => {
    let y = MARGIN + HEADER_H;
    for (const file of group.files) {
      positions.set(file.id, { x, y, w: BOX_W, h: BOX_H, groupIndex, groupDir: group.dir });
      y += BOX_H + ROW_GAP;
    }
    maxRows = Math.max(maxRows, group.files.length);
    const col = { dir: group.dir, groupIndex, count: group.files.length };
    x += BOX_W + COL_GAP;
    return col;
  });

  // Legend, gruplar dar-ama-cok-satirli bir grid'den daha genis olabilir
  // (orn. az sutun, derin dizin agaci) -- canvas genisligi legend'i de kapsamali.
  const legendSlots = Math.min(columns.length, MAX_GROUPS_COLORED) + (columns.length > MAX_GROUPS_COLORED ? 1 : 0);
  const legendWidth = MARGIN + legendSlots * 170;

  const width = Math.max(x, MARGIN * 2 + BOX_W, legendWidth);
  const height = MARGIN * 2 + HEADER_H + maxRows * (BOX_H + ROW_GAP);

  return { positions, columns, width, height, groupCount: groups.length };
}

/** `box`'in `otherBox`'a bakan kenarindaki baglanti noktasini hesaplar (basit grid-tabanli yonlendirme). */
function anchorPoint(box, otherBox) {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const ocx = otherBox.x + otherBox.w / 2;
  if (Math.abs(ocx - cx) > box.w) {
    return ocx > cx ? { x: box.x + box.w, y: cy } : { x: box.x, y: cy };
  }
  return { x: cx, y: otherBox.y > box.y ? box.y + box.h : box.y };
}

function buildLegend(columns, themeName, t) {
  const shown = columns.slice(0, MAX_GROUPS_COLORED);
  const hasOverflow = columns.length > MAX_GROUPS_COLORED;
  const entries = shown.map((col) => ({ label: col.dir, color: colorForGroupIndex(col.groupIndex)[themeName] }));
  if (hasOverflow) {
    entries.push({ label: `Diger (${columns.length - MAX_GROUPS_COLORED})`, color: OTHER_GROUP[themeName] });
  }
  return entries
    .map((entry, i) => {
      const lx = MARGIN + i * 170;
      return `<circle cx="${lx}" cy="${MARGIN / 2}" r="5" fill="${entry.color}" /><text x="${lx + 12}" y="${MARGIN / 2 + 4}" font-size="11.5" fill="${t.secondaryInk}">${escapeXml(truncate(entry.label, 22))}</text>`;
    })
    .join('\n    ');
}

function buildSvgBody(graphData, layout, themeName) {
  const t = TOKENS[themeName];
  const { positions, width, height } = layout;
  const importEdges = graphData.edges.filter((e) => e.type === 'imports' && positions.has(e.from) && positions.has(e.to));
  const nodeById = new Map(graphData.nodes.map((n) => [n.id, n]));

  const edgeMarkup = importEdges
    .map((edge) => {
      const from = positions.get(edge.from);
      const to = positions.get(edge.to);
      const p1 = anchorPoint(from, to);
      const p2 = anchorPoint(to, from);
      const midX = (p1.x + p2.x) / 2;
      return `<path d="M ${p1.x} ${p1.y} C ${midX} ${p1.y}, ${midX} ${p2.y}, ${p2.x} ${p2.y}" fill="none" stroke="${t.baseline}" stroke-width="1.5" marker-end="url(#pt-arrow-${themeName})" opacity="0.75" />`;
    })
    .join('\n    ');

  const nodeMarkup = [...positions.entries()]
    .map(([id, box]) => {
      const node = nodeById.get(id);
      const color = colorForGroupIndex(box.groupIndex)[themeName];
      const label = escapeXml(truncate(node.name, 27));
      const subtitleParts = [];
      if (node.functionCount) subtitleParts.push(`${node.functionCount} fn`);
      if (node.classCount) subtitleParts.push(`${node.classCount} class`);
      const subtitle = escapeXml(truncate(subtitleParts.length ? subtitleParts.join(' · ') : box.groupDir || '(kok)', 30));

      return `<g>
      <rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="10" fill="${t.surface}" stroke="${color}" stroke-width="2" />
      <text x="${box.x + 14}" y="${box.y + 27}" font-size="13.5" font-weight="600" fill="${t.primaryInk}">${label}</text>
      <text x="${box.x + 14}" y="${box.y + 46}" font-size="11.5" fill="${t.mutedInk}">${subtitle}</text>
    </g>`;
    })
    .join('\n    ');

  const legendMarkup = buildLegend(layout.columns, themeName, t);

  return `<defs>
    <marker id="pt-arrow-${themeName}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="${t.baseline}" />
    </marker>
  </defs>
  <rect x="0" y="0" width="${width}" height="${height}" fill="${t.pagePlane}" />
  <g>${legendMarkup}</g>
  <g>${edgeMarkup}</g>
  <g>${nodeMarkup}</g>`;
}

/**
 * Grafigi hem acik hem koyu tema icin uretir; her ikisi de tek bir standalone
 * SVG icine gomulur ve `prefers-color-scheme` CSS media query'siyle secilir --
 * boylece dosya dogrudan tarayicida acildiginda sistem temasina uyar.
 */
function buildThemedSvg(graphData) {
  const layout = computeLayout(graphData);

  if (layout.groupCount === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="120" viewBox="0 0 520 120" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif">
  <rect width="520" height="120" fill="${TOKENS.light.pagePlane}" />
  <text x="24" y="64" font-size="13" fill="${TOKENS.light.mutedInk}">Henuz taranmis dosya yok -- "npx preserved-tablet sync" calistirin.</text>
</svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif">
  <style>
    .pt-dark { display: none; }
    @media (prefers-color-scheme: dark) {
      .pt-light { display: none; }
      .pt-dark { display: inline; }
    }
  </style>
  <g class="pt-light">${buildSvgBody(graphData, layout, 'light')}</g>
  <g class="pt-dark">${buildSvgBody(graphData, layout, 'dark')}</g>
</svg>`;
}

function buildHtmlWrapper(svgMarkup, meta) {
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>The Preserved Tablet — Proje Haritasi</title>
<style>
  body { margin: 0; padding: 32px; background: #f9f9f7; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
  @media (prefers-color-scheme: dark) { body { background: #0d0d0d; } }
  h1 { font-size: 15px; color: #52514e; font-weight: 600; margin: 0 0 4px; }
  @media (prefers-color-scheme: dark) { h1 { color: #c3c2b7; } }
  p.meta { font-size: 12px; color: #898781; margin: 0 0 20px; }
  .wrap { overflow-x: auto; }
</style>
</head>
<body>
  <h1>The Preserved Tablet — Proje Haritasi</h1>
  <p class="meta">Son senkronizasyon: ${escapeXml(meta.lastSyncAt || 'bilinmiyor')} · durum: ${escapeXml(meta.status || 'stub')}</p>
  <div class="wrap">${svgMarkup}</div>
</body>
</html>
`;
}

async function writeDiagram(root, graphData) {
  const svg = buildThemedSvg(graphData);
  const svgPath = path.join(root, '.memory', 'diagram.svg');
  const htmlPath = path.join(root, '.memory', 'diagram.html');

  await fs.writeFile(svgPath, svg, 'utf8');
  await fs.writeFile(htmlPath, buildHtmlWrapper(svg, graphData.meta), 'utf8');

  return { svgPath, htmlPath };
}

module.exports = { writeDiagram, buildThemedSvg, computeLayout };
