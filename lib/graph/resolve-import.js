'use strict';

const path = require('path');

const RESOLVABLE_EXT = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json'];
const INDEX_FILES = RESOLVABLE_EXT.map((ext) => `index${ext}`);

/**
 * `import`/`require` icindeki bir specifier'i projedeki gercek bir dosyaya
 * cozer. Sadece GORECELI (`./`, `../`) specifier'lar cozulur -- npm paketleri
 * (`react`, `lodash/get` vb.) bilincli olarak harici bagimlilik kabul edilir
 * ve graph'ta dugum olarak temsil edilmez (node_modules'un tamamini graph'a
 * dahil etmemek icin).
 *
 * @param {string} specifier - import/require icindeki ham string
 * @param {string} fromFile - specifier'in gectigi dosyanin mutlak yolu
 * @param {Set<string>} allFilesSet - projede izlenen tum dosyalarin mutlak yol kumesi
 * @returns {string|null} cozulen mutlak dosya yolu, ya da bulunamazsa/harici ise null
 */
function resolveImport(specifier, fromFile, allFilesSet) {
  if (!specifier.startsWith('.')) return null;

  const baseDir = path.dirname(fromFile);
  const target = path.resolve(baseDir, specifier);

  const candidates = [
    target,
    ...RESOLVABLE_EXT.map((ext) => target + ext),
    ...INDEX_FILES.map((f) => path.join(target, f)),
  ];

  for (const candidate of candidates) {
    if (allFilesSet.has(candidate)) return candidate;
  }
  return null;
}

module.exports = { resolveImport };
