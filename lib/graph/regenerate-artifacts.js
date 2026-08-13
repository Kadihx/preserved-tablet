'use strict';

const fs = require('fs/promises');
const path = require('path');

const { renderContext } = require('./render-context');
const { writeDiagram } = require('../../diagram-engine/generate');
const { writeCanvasMarkdown } = require('../../canvas-engine/generate-markdown');

/**
 * Mevcut `.memory/graph-map.json` verisinden context.md, diagram.svg/html ve
 * canvas.md'yi YENIDEN TARAMA YAPMADAN tazeler. `sync`/`watch` zaten her
 * degisiklikte bunu otomatik yapar; bu fonksiyon sadece hizli bir manuel
 * "gorselleri yenile" komutu (`preserved-tablet diagram`) icin var.
 */
async function regenerateArtifacts(root) {
  const graphPath = path.join(root, '.memory', 'graph-map.json');
  const data = JSON.parse(await fs.readFile(graphPath, 'utf8'));

  await renderContext(root, data);
  const { svgPath, htmlPath } = await writeDiagram(root, data);
  const { outPath: canvasPath } = await writeCanvasMarkdown(root, data);

  return { svgPath, htmlPath, canvasPath };
}

module.exports = { regenerateArtifacts };
