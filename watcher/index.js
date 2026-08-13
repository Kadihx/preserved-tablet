'use strict';

const chokidar = require('chokidar');

const config = require('./config');
const { recordChange } = require('./graph-updater');
const { resolveConsumerRoot } = require('../lib/paths');

/**
 * Surekli/foreground watcher. Dosya kaydetmelerini algilar, debounce ile
 * biriktirir ve graph-updater'i tetikler. `Ctrl+C` (SIGINT) veya SIGTERM ile
 * duzgun kapanir.
 */
function startWatcher() {
  const root = resolveConsumerRoot();

  const watcher = chokidar.watch(root, {
    ignored: config.ignoredFn,
    ignoreInitial: true,
    persistent: true,
    // editorlerin atomic-save davranisini (once gecici dosyaya yaz, sonra rename)
    // beklemek icin -- yarim yazilmis dosyayi okumaya calismayi engeller.
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 100 },
  });

  let pending = new Set();
  let timer = null;

  const flush = () => {
    const files = [...pending];
    pending = new Set();
    if (files.length === 0) return;
    recordChange(files).catch((err) => console.error('[preserved-tablet] graph guncelleme hatasi:', err));
  };

  const schedule = (filePath) => {
    pending.add(filePath);
    clearTimeout(timer);
    timer = setTimeout(flush, config.DEBOUNCE_MS);
  };

  watcher.on('add', schedule).on('change', schedule).on('unlink', schedule);
  watcher.on('ready', () => console.log(`[preserved-tablet] Izleniyor: ${root}`));
  watcher.on('error', (err) => console.error('[preserved-tablet] watcher hatasi:', err));

  const shutdown = () => {
    clearTimeout(timer);
    watcher.close().then(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return watcher;
}

module.exports = { startWatcher };
