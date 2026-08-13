#!/usr/bin/env node
'use strict';

const { scaffold } = require('../lib/scaffold');
const { isCI } = require('../lib/env');

/**
 * postinstall SADECE scaffold yapar; watcher'i OTOMATIK BASLATMAZ.
 *
 * Neden: npm v12 lifecycle script'lerini (preinstall/install/postinstall) artik
 * varsayilan olarak devre disi birakiyor (kullanici `npm approve-scripts` ile elle
 * onaylamadikca calismiyorlar) ve Yarn Berry zaten varsayilan olarak engelliyordu.
 * Ayrica postinstall icinde arka planda kalici bir process baslatmak, guvenlik
 * tarayicilari (Socket/Snyk) tarafindan supply-chain saldirisi imzasina benzer
 * davranis olarak isaretlenebiliyor ve postinstall hata/hang olursa tum
 * `npm install` kirilabiliyor (CI'da felaket).
 *
 * Bunun yerine: hafizayi anlik guncellemek icin `npx preserved-tablet sync`
 * (tek seferlik, hizli) veya surekli izleme icin `npx preserved-tablet watch`/`start`
 * KULLANICI TARAFINDAN acikca calistirilir. Claude Code de ai-rules.md'deki talimat
 * geregi kullanici "hafizaya kaydet" dedigi zaman `sync` komutunu kendisi tetikler.
 */
async function main() {
  if (isCI()) {
    console.log('[preserved-tablet] CI ortami algilandi, scaffold atlaniyor.');
    return;
  }

  try {
    const { memoryDir, createdFiles } = await scaffold();

    if (createdFiles.length > 0) {
      console.log(`[preserved-tablet] .memory/ hazirlandi: ${memoryDir}`);
    } else {
      console.log(`[preserved-tablet] .memory/ zaten mevcut, dokunulmadi: ${memoryDir}`);
    }

    console.log('[preserved-tablet] Watcher otomatik baslatilmadi.');
    console.log('[preserved-tablet]   Anlik hafiza guncellemesi icin: npx preserved-tablet sync');
    console.log('[preserved-tablet]   Surekli izleme icin (foreground): npx preserved-tablet watch');
    console.log('[preserved-tablet]   Surekli izleme icin (arka plan):  npx preserved-tablet start');
  } catch (err) {
    // postinstall hatasi tum `npm install`'i kirmamali; hatayi sadece logla.
    console.warn('[preserved-tablet] scaffold atlandi (kritik degil):', err.message);
  }

  process.exitCode = 0;
}

main();
