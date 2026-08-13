'use strict';

const fs = require('fs');
const path = require('path');

const config = require('./config');

/**
 * Proje agacini manuel olarak recursive gezer (Node 16 uyumlulugu icin
 * `fs.readdirSync(..., {recursive: true})` yerine -- o secenek Node 20+
 * gerektiriyor). `config.ignoredFn` ile hem `sync.js` hem `graph-updater.js`
 * AYNI ignore mantigini paylasir; bu dosya ikisi tarafindan da kullanilir ve
 * aralarinda dongusel bagimlilik olusmasini engeller.
 */
function walkDir(dir, collected) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return collected; // izin hatasi vb. -- sessizce atla
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (config.ignoredFn(fullPath, { isFile: () => false })) continue;
      walkDir(fullPath, collected);
    } else if (entry.isFile()) {
      if (config.ignoredFn(fullPath, { isFile: () => true })) continue;
      collected.push(fullPath);
    }
  }

  return collected;
}

function walkProject(root) {
  return walkDir(root, []);
}

module.exports = { walkProject };
