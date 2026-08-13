'use strict';

const fs = require('fs/promises');
const path = require('path');

const HUMAN_START = '<!-- HUMAN-NOTES-START -->';
const HUMAN_END = '<!-- HUMAN-NOTES-END -->';

function summarize(graphData) {
  const fileNodes = graphData.nodes.filter((n) => n.type === 'file');
  const fnNodes = graphData.nodes.filter((n) => n.type === 'function');
  const clsNodes = graphData.nodes.filter((n) => n.type === 'class');
  const importEdges = graphData.edges.filter((e) => e.type === 'imports');

  const byDir = new Map();
  for (const node of fileNodes) {
    const dir = node.dir || '(kok)';
    byDir.set(dir, (byDir.get(dir) || 0) + 1);
  }
  const dirLines = [...byDir.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([dir, count]) => `- \`${dir}/\` — ${count} dosya`)
    .join('\n');

  const incoming = new Set(importEdges.map((e) => e.to));
  const outgoing = new Map();
  for (const edge of importEdges) outgoing.set(edge.from, (outgoing.get(edge.from) || 0) + 1);

  const entryPoints = fileNodes
    .filter((n) => !incoming.has(n.id) && outgoing.has(n.id))
    .slice(0, 10)
    .map((n) => `- \`${n.id}\``)
    .join('\n');

  const hubs = [...outgoing.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id, count]) => `- \`${id}\` — ${count} ic import`)
    .join('\n');

  return `## Proje Ozeti

- Toplam dosya: **${fileNodes.length}**
- Toplam fonksiyon: **${fnNodes.length}**, sinif: **${clsNodes.length}**
- Proje-ici import iliskisi: **${importEdges.length}**
- Son senkronizasyon: ${graphData.meta.lastSyncAt || 'bilinmiyor'} (durum: ${graphData.meta.status})

## Dizin Dagilimi

${dirLines || '(henuz dosya yok)'}

## Olasi Giris Noktalari

(Baska hicbir izlenen dosya tarafindan import edilmeyen ama kendisi en az bir dosya import eden dosyalar)

${entryPoints || '(tespit edilemedi)'}

## En Cok Ic-Import Yapan Dosyalar

${hubs || '(tespit edilemedi)'}

## Ana Modul/Dosya Haritasi

Tam graph verisi icin bkz. \`.memory/graph-map.json\`. Gorsel mimari haritasi:
\`.memory/diagram.svg\` (veya tarayicida acilabilir \`.memory/diagram.html\`).
`;
}

/**
 * context.md'yi yeniden uretir: HUMAN-NOTES blogu KORUNUR (marker'lar arasi
 * icerik oldugu gibi tasinir), geri kalan otomatik-uretilen icerik tazelenir.
 */
async function renderContext(root, graphData) {
  const contextPath = path.join(root, '.memory', 'context.md');

  let existing = '';
  try {
    existing = await fs.readFile(contextPath, 'utf8');
  } catch {
    existing = '';
  }

  const startIdx = existing.indexOf(HUMAN_START);
  const endIdx = existing.indexOf(HUMAN_END);
  const humanBlock =
    startIdx !== -1 && endIdx !== -1
      ? existing.slice(startIdx, endIdx + HUMAN_END.length)
      : `${HUMAN_START}\n## Insan Notlari\n\n(Bu bolumu serbestce duzenleyebilirsiniz — otomatik uretim bu bolume dokunmaz.)\n${HUMAN_END}`;

  const content = `# Proje Hafizasi (The Preserved Tablet)

> Bu dosya \`.memory/context.md\` olarak preserved-tablet tarafindan otomatik guncellenir.
> Son guncelleme: ${new Date().toISOString()}
>
> AI asistanlarin bu projeyi anlamasi icin BIRINCIL baglam kaynagidir.
> Okuma/kullanim kurallari icin bkz. \`.memory/ai-rules.md\`.

${summarize(graphData)}
${humanBlock}
`;

  await fs.writeFile(contextPath, content, 'utf8');
}

module.exports = { renderContext };
