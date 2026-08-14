'use strict';

const path = require('path');
const { parseFile, canParse } = require('./parse-file');
const { resolveImport } = require('./resolve-import');

function toId(root, absPath) {
  return path.relative(root, absPath).split(path.sep).join('/');
}

/**
 * Verilen (ignore kurallarina gore onceden filtrelenmis) mutlak dosya yolu
 * listesinden tam bir nodes/edges graph'i uretir.
 *
 * Dugum turleri: 'file', 'function', 'class'.
 * Kenar turleri: 'imports' (file -> file), 'contains' (file -> function/class).
 *
 * FAZ 2 KAPSAMI: cagri-grafigi (hangi fonksiyon hangisini cagiriyor) analiz
 * edilmiyor -- bu tam bir scope/binding cozumlemesi gerektirir ve kapsam
 * disi birakildi. Sadece statik import/export iliskileri ve dosya-ici
 * fonksiyon/sinif envanteri cikariliyor.
 */
function buildGraph(root, absFilePaths) {
  const fileSet = new Set(absFilePaths);
  const nodes = [];
  const edges = [];
  let parseErrors = 0;

  for (const absPath of absFilePaths) {
    const id = toId(root, absPath);
    const dirId = path.dirname(id) === '.' ? '' : path.dirname(id).split(path.sep).join('/');

    const fileNode = {
      id,
      type: 'file',
      name: path.basename(absPath),
      dir: dirId,
    };

    if (!canParse(absPath)) {
      nodes.push(fileNode);
      continue;
    }

    const parsed = parseFile(absPath);
    if (parsed.error) parseErrors += 1;

    fileNode.functionCount = parsed.functions.length;
    fileNode.classCount = parsed.classes.length;
    fileNode.exportCount = parsed.exports.length;
    // Yorumlardan cikarilan kisa aciklama: Claude'un dosyayi ACMADAN ne ise
    // yaradigini anlamasi icin -- bkz. lib/graph/parse-file.js#commentToDescription.
    if (parsed.fileDescription) fileNode.description = parsed.fileDescription;
    nodes.push(fileNode);

    parsed.functions.forEach(({ name, description }) => {
      const fnId = `${id}#${name}`;
      const fnNode = { id: fnId, type: 'function', name, file: id };
      if (description) fnNode.description = description;
      nodes.push(fnNode);
      edges.push({ from: id, to: fnId, type: 'contains' });
    });

    parsed.classes.forEach(({ name, description }) => {
      const clsId = `${id}#${name}`;
      const clsNode = { id: clsId, type: 'class', name, file: id };
      if (description) clsNode.description = description;
      nodes.push(clsNode);
      edges.push({ from: id, to: clsId, type: 'contains' });
    });

    parsed.imports.forEach((specifier) => {
      const resolved = resolveImport(specifier, absPath, fileSet);
      if (!resolved) return; // harici paket veya izlenmeyen/ignore edilen dosya
      const targetId = toId(root, resolved);
      if (targetId === id) return; // kendine referans
      edges.push({ from: id, to: targetId, type: 'imports' });
    });
  }

  const dedupedEdges = [];
  const seen = new Set();
  for (const edge of edges) {
    const key = `${edge.type}:${edge.from}->${edge.to}`;
    if (seen.has(key)) continue;
    seen.add(key);
    dedupedEdges.push(edge);
  }

  return { nodes, edges: dedupedEdges, parseErrors };
}

module.exports = { buildGraph };
