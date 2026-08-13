'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const { resolveConsumerRoot } = require('../lib/paths');

function pidFilePath() {
  return path.join(resolveConsumerRoot(), '.memory', 'watcher.pid');
}

function logFilePath() {
  return path.join(resolveConsumerRoot(), '.memory', 'watcher.log');
}

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Watcher'i arka planda (detached) bir process olarak baslatir; pid dosyasi
 * ile tekrar-baslatmayi engeller. Opsiyonel bir ozelliktir -- postinstall
 * bunu OTOMATIK cagirmaz, sadece `preserved-tablet start` komutuyla tetiklenir.
 */
function spawnDetachedWatcher() {
  const pidPath = pidFilePath();

  if (fs.existsSync(pidPath)) {
    const existingPid = Number(fs.readFileSync(pidPath, 'utf8').trim());
    if (existingPid && isAlive(existingPid)) {
      console.log(`[preserved-tablet] Watcher zaten calisiyor (pid ${existingPid}).`);
      return;
    }
  }

  const logPath = logFilePath();
  const logFd = fs.openSync(logPath, 'a');

  const watcherEntry = path.join(__dirname, 'index.js');
  const bootScript = `require(${JSON.stringify(watcherEntry)}).startWatcher();`;

  const child = spawn(process.execPath, ['-e', bootScript], {
    detached: true,
    // 'inherit' KULLANILMAZ: Windows'ta parent stdio'ya bagli kalirsa parent
    // process'in duzgun cikmasini engelleyebiliyor (bkz. nodejs/node#5614).
    stdio: ['ignore', logFd, logFd],
    windowsHide: true,
    cwd: resolveConsumerRoot(),
  });

  fs.writeFileSync(pidPath, String(child.pid));
  child.unref();

  console.log(`[preserved-tablet] Watcher arka planda baslatildi (pid ${child.pid}).`);
  console.log(`[preserved-tablet] Log dosyasi: ${logPath}`);
}

function stopDaemon() {
  const pidPath = pidFilePath();

  if (!fs.existsSync(pidPath)) {
    console.log('[preserved-tablet] Calisan bir watcher bulunamadi.');
    return;
  }

  const pid = Number(fs.readFileSync(pidPath, 'utf8').trim());
  if (pid && isAlive(pid)) {
    process.kill(pid, 'SIGTERM');
    console.log(`[preserved-tablet] Watcher durduruldu (pid ${pid}).`);
  } else {
    console.log('[preserved-tablet] Watcher zaten calismiyor gorunuyor.');
  }

  fs.unlinkSync(pidPath);
}

module.exports = { spawnDetachedWatcher, stopDaemon };
