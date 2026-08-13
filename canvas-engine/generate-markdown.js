'use strict';

const fs = require('fs/promises');
const path = require('path');

/**
 * FAZ 3 TASARIM KARARI: BlockSuite'in canli editorunu (AffineEditorContainer)
 * dogrudan gommek yerine (ki bu, AFFiNE'in kendi resmi starter ornegine gore
 * SpecProvider/extension/DI/mock-service gibi bircok ic API'yi dogru sekilde
 * yeniden kurmayi gerektiriyor -- kirilgan ve agir), gercek AFFiNE'e
 * IMPORT EDILEBILIR bir Markdown dosyasi uretiyoruz. Kullanici bu dosyayi
 * kendi (gercek, kurulu) AFFiNE uygulamasina surukleyip birakabilir; AFFiNE
 * herhangi bir sayfayi yerlesik "Page -> Edgeless" gecisiyle mekansal canvas
 * gorunumune cevirebiliyor. Boylece kod fork edilmeden veya kararsiz bir ic
 * API'ye baglanilmadan gercek AFFiNE deneyimi elde ediliyor.
 */

function svgToDataUri(svgContent) {
  const base64 = Buffer.from(svgContent, 'utf8').toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

function buildMarkdown(graphData, diagramSvg) {
  const fileNodes = graphData.nodes.filter((n) => n.type === 'file');
  const fnNodes = graphData.nodes.filter((n) => n.type === 'function');
  const clsNodes = graphData.nodes.filter((n) => n.type === 'class');
  const importEdges = graphData.edges.filter((e) => e.type === 'imports');

  const byDir = new Map();
  for (const node of fileNodes) {
    const dir = node.dir || '(kok)';
    if (!byDir.has(dir)) byDir.set(dir, []);
    byDir.get(dir).push(node);
  }

  const importsByFile = new Map();
  for (const edge of importEdges) {
    if (!importsByFile.has(edge.from)) importsByFile.set(edge.from, []);
    importsByFile.get(edge.from).push(edge.to);
  }

  const childrenByFile = new Map();
  for (const node of [...fnNodes, ...clsNodes]) {
    if (!childrenByFile.has(node.file)) childrenByFile.set(node.file, []);
    childrenByFile.get(node.file).push(node);
  }

  const lines = [];
  lines.push('# The Preserved Tablet — Proje Haritasi');
  lines.push('');
  lines.push(`> Otomatik uretildi: ${new Date().toISOString()} — ${fileNodes.length} dosya, ${fnNodes.length} fonksiyon, ${clsNodes.length} sinif, ${importEdges.length} import iliskisi.`);
  lines.push('');
  lines.push('Bu notu AFFiNE workspace\'inize aktardiktan sonra sag üstten **Edgeless** moduna gecerek mekansal/canvas gorunumunde kesfedebilirsiniz.');
  lines.push('');

  if (diagramSvg) {
    lines.push('## Mimari Gorseli');
    lines.push('');
    lines.push(`![Proje mimari haritasi](${svgToDataUri(diagramSvg)})`);
    lines.push('');
  }

  for (const [dir, files] of [...byDir.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`## ${dir || '(kok)'}`);
    lines.push('');
    for (const file of files.sort((a, b) => a.name.localeCompare(b.name))) {
      lines.push(`### ${file.name}`);
      lines.push('');
      lines.push(`\`${file.id}\``);
      lines.push('');

      const children = childrenByFile.get(file.id) || [];
      if (children.length > 0) {
        const fns = children.filter((c) => c.type === 'function').map((c) => c.name);
        const clss = children.filter((c) => c.type === 'class').map((c) => c.name);
        if (fns.length) lines.push(`- Fonksiyonlar: ${fns.map((n) => `\`${n}\``).join(', ')}`);
        if (clss.length) lines.push(`- Siniflar: ${clss.map((n) => `\`${n}\``).join(', ')}`);
      }

      const imports = importsByFile.get(file.id) || [];
      if (imports.length) {
        lines.push(`- Import ettikleri: ${imports.map((id) => `\`${id}\``).join(', ')}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

async function writeCanvasMarkdown(root, graphData) {
  const svgPath = path.join(root, '.memory', 'diagram.svg');
  let diagramSvg = null;
  try {
    diagramSvg = await fs.readFile(svgPath, 'utf8');
  } catch {
    diagramSvg = null; // diyagram henuz uretilmemis -- gorselsiz devam et
  }

  const markdown = buildMarkdown(graphData, diagramSvg);
  const outPath = path.join(root, '.memory', 'canvas.md');
  await fs.writeFile(outPath, markdown, 'utf8');
  return { outPath };
}

module.exports = { writeCanvasMarkdown, buildMarkdown };
