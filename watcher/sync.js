'use strict';

const { walkProject } = require('./walk-project');
const { recordChange } = require('./graph-updater');
const { resolveConsumerRoot } = require('../lib/paths');

/**
 * Tek seferlik, tam-proje senkronizasyonu. Watcher daemon'i calismiyorken bile
 * Claude Code'un sohbet icinde "hafizaya kaydet" istegini karsilamasi icin
 * asil mekanizma budur -- arka planda surekli process gerektirmez.
 */
async function syncOnce() {
  const root = resolveConsumerRoot();
  const files = walkProject(root);
  await recordChange(files);
  return { root, fileCount: files.length };
}

module.exports = { syncOnce };
