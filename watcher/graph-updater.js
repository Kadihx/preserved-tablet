'use strict';

const fs = require('fs/promises');
const path = require('path');

const { resolveConsumerRoot } = require('../lib/paths');
const { walkProject } = require('./walk-project');
const { buildGraph } = require('../lib/graph/build-graph');
const { renderContext } = require('../lib/graph/render-context');
const { writeDiagram } = require('../diagram-engine/generate');
const { writeCanvasMarkdown } = require('../canvas-engine/generate-markdown');

const MAX_PENDING_HISTORY = 200;

function emptyGraph() {
  return {
    meta: {
      schemaVersion: '1.0.0',
      status: 'stub',
      createdAt: new Date().toISOString(),
      lastSyncAt: null,
      pendingFiles: [],
    },
    nodes: [],
    edges: [],
  };
}

/**
 * Degisen dosyalari kaydeder VE tum proje icin graph'i yeniden insa eder.
 * Import iliskileri degisen dosyalarin disindaki dosyalari da etkileyebilecegi
 * icin (ornegin X, Y'yi import ediyorsa ve sadece Y degisse bile X'in
 * "imports" kenari gecerliligini korumali), her cagrida TUM proje yeniden
 * taranip parse edilir.
 *
 * FAZ 3 ICIN BILINEN SINIRLAMA: buyuk projelerde her kayitta tam-proje
 * yeniden-parse etmek pahali olabilir; artimli (incremental) guncelleme
 * kapsam disi birakildi.
 *
 * @param {string[]} changedFiles - degistigi bilinen mutlak dosya yollari (gozlemlenebilirlik icin)
 */
async function recordChange(changedFiles) {
  const root = resolveConsumerRoot();
  const graphPath = path.join(root, '.memory', 'graph-map.json');

  let data;
  try {
    data = JSON.parse(await fs.readFile(graphPath, 'utf8'));
  } catch {
    data = emptyGraph();
  }
  data.meta = data.meta || {};

  const relativeChanged = changedFiles.map((f) => path.relative(root, f).split(path.sep).join('/'));
  const mergedPending = new Set([...(data.meta.pendingFiles || []), ...relativeChanged]);
  data.meta.pendingFiles = [...mergedPending].slice(-MAX_PENDING_HISTORY);

  const allFiles = walkProject(root);
  const { nodes, edges, parseErrors } = buildGraph(root, allFiles);

  data.nodes = nodes;
  data.edges = edges;
  data.meta.status = parseErrors > 0 ? 'partial' : 'parsed';
  data.meta.parseErrors = parseErrors;
  data.meta.lastSyncAt = new Date().toISOString();

  const tmpPath = `${graphPath}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmpPath, graphPath); // atomic write: process kill edilirse bozuk JSON riski olmaz

  await renderContext(root, data).catch((err) => console.error('[preserved-tablet] context.md guncelleme hatasi:', err.message));
  await writeDiagram(root, data).catch((err) => console.error('[preserved-tablet] diagram uretme hatasi:', err.message));
  await writeCanvasMarkdown(root, data).catch((err) => console.error('[preserved-tablet] canvas.md uretme hatasi:', err.message));

  return data;
}

module.exports = { recordChange, emptyGraph };
