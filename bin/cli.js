#!/usr/bin/env node
'use strict';

const { scaffold } = require('../lib/scaffold');
const { syncOnce } = require('../watcher/sync');
const { startWatcher } = require('../watcher/index');
const { spawnDetachedWatcher, stopDaemon } = require('../watcher/daemon');
const { regenerateArtifacts } = require('../lib/graph/regenerate-artifacts');
const { resolveConsumerRoot } = require('../lib/paths');
const { startDashboard } = require('../dashboard/server');

const USAGE = `Kullanim: preserved-tablet <komut>

Komutlar:
  init      .memory/ dizinini ve Claude Code kural dosyasini olusturur (idempotent);
            projeyi merkezi panele (~/.preserved-tablet/) otomatik kaydeder.
  sync      Tek seferlik tam-proje taramasi + AST analizi yapar, graph-map.json,
            context.md, diagram.svg/html ve canvas.md'yi gunceller. Claude Code
            sohbetinde "hafizaya kaydet" dendiginde calistirilan komut budur.
  diagram   Yeniden taramadan, mevcut graph-map.json'dan context.md, diagram
            ve canvas.md'yi hizlica yeniden uretir.
  watch     Surekli izleme baslatir (foreground, Ctrl+C ile durur).
  start     Surekli izlemeyi arka planda baslatir (pid dosyali).
  stop      Arka planda calisan watcher'i durdurur.
  dashboard init edilmis TUM projeleri tek bir localhost panelinde listeler
            (sadece 127.0.0.1 -- yerel aga acik degil). Opsiyonel: --port <n>.

.memory/canvas.md, gercek AFFiNE uygulamaniza surukleyip birakarak import
edebileceginiz, diyagrami gomulu iceren bir Markdown dosyasidir. Import
sonrasi sayfayi Edgeless moduna gecirerek mekansal canvas gorunumunu
kullanabilirsiniz.
`;

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'init': {
      const { memoryDir } = await scaffold();
      console.log(`[preserved-tablet] Hazir: ${memoryDir}`);
      break;
    }
    case 'sync': {
      const { fileCount } = await syncOnce();
      console.log(`[preserved-tablet] Senkronize edildi (${fileCount} dosya tarandi).`);
      break;
    }
    case 'diagram': {
      const { svgPath } = await regenerateArtifacts(resolveConsumerRoot());
      console.log(`[preserved-tablet] Diyagram yenilendi: ${svgPath}`);
      break;
    }
    case 'watch': {
      startWatcher();
      break;
    }
    case 'start': {
      spawnDetachedWatcher();
      break;
    }
    case 'stop': {
      stopDaemon();
      break;
    }
    case 'dashboard': {
      const portFlagIndex = process.argv.indexOf('--port');
      const port = portFlagIndex !== -1 ? Number(process.argv[portFlagIndex + 1]) : undefined;
      startDashboard(port ? { port } : {});
      break;
    }
    default: {
      console.log(USAGE);
      process.exitCode = command ? 1 : 0;
    }
  }
}

main().catch((err) => {
  console.error('[preserved-tablet] hata:', err.message);
  process.exitCode = 1;
});
