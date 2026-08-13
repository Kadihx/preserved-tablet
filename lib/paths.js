'use strict';

const path = require('path');

/**
 * Tuketici projenin kok dizinini bulur.
 *
 * Oncelik sirasi:
 * 1. INIT_CWD  -> npm/yarn classic'in `npm install` calistirilan orijinal dizini icin sagladigi env degiskeni.
 * 2. __dirname'den `node_modules` segmentine gore geriye sarma -> paket `node_modules/preserved-tablet/lib` altinda
 *    calisirken kok proje dizinini turetir (INIT_CWD bazi paket yoneticilerinde/ortamlarda set edilmeyebilir).
 * 3. process.cwd() -> son care (ornegin `npx preserved-tablet` dogrudan proje kokunde calistirilirsa).
 */
function resolveConsumerRoot() {
  if (process.env.INIT_CWD) {
    return process.env.INIT_CWD;
  }

  const segments = __dirname.split(path.sep);
  const nodeModulesIndex = segments.lastIndexOf('node_modules');
  if (nodeModulesIndex > 0) {
    return segments.slice(0, nodeModulesIndex).join(path.sep);
  }

  return process.cwd();
}

module.exports = { resolveConsumerRoot };
