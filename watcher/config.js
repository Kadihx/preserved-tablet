'use strict';

const path = require('path');

// Bu klasor adlarindan herhangi biri yol icinde gecerse dosya/dizin tamamen atlanir.
const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.memory',
  '.claude',
  '.cursor',
  'dist',
  'build',
  'out',
  'coverage',
  '.next',
  '.nuxt',
  '.cache',
  '.turbo',
  'vendor',
]);

// Sadece bu uzantilara sahip dosyalar izlenir (bos uzanti -- ornegin `Makefile` -- her zaman izlenir).
const WATCHED_EXT = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.py', '.go', '.java', '.kt', '.rb', '.php', '.rs', '.c', '.cpp', '.h', '.hpp',
  '.json', '.md',
]);

const DEBOUNCE_MS = 400;

/**
 * chokidar v4 ile uyumlu ignore fonksiyonu. chokidar v4, `ignored` secenegi
 * icin glob string yerine `(path, stats) => boolean` imzasi bekliyor.
 *
 * ONEMLI: chokidar, Windows'ta bile yollari `/` ile normalize edip veriyor
 * (native ayirici `\` degil). Bu yuzden burada SADECE `path.sep` ile
 * bolmek segment eslesmesini kirar (tum yol tek bir segment gibi algilanir
 * ve `.memory` gibi klasorler hicbir zaman ignore edilmez). Hem `/` hem `\`
 * ayiricilarini kabul eden bir regex ile bolmek, fonksiyonu chokidar'in
 * (forward-slash) ve fs.readdirSync tabanli manuel walk'in (native ayirici)
 * her ikisiyle de dogru calisir hale getirir.
 */
function ignoredFn(filePath, stats) {
  const segments = filePath.split(/[\\/]+/);
  if (segments.some((segment) => IGNORED_DIRS.has(segment))) {
    return true;
  }

  if (stats && stats.isFile && stats.isFile()) {
    const ext = path.extname(filePath);
    if (ext !== '' && !WATCHED_EXT.has(ext)) {
      return true;
    }
  }

  return false;
}

module.exports = { IGNORED_DIRS, WATCHED_EXT, DEBOUNCE_MS, ignoredFn };
