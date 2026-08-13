'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

/**
 * Kullanici genelindeki merkezi kayit defteri: hangi projelerde
 * preserved-tablet kurulu oldugunu tutar. Bilerek proje repolarinin
 * DISINDA, kullanicinin home dizininde tutulur -- boylece hicbir projenin
 * git gecmisine karismaz ve tum projelerden BAGIMSIZ, kullaniciya ozel bir
 * kayittir.
 */
function registryDir() {
  return path.join(os.homedir(), '.preserved-tablet');
}

function registryPath() {
  return path.join(registryDir(), 'projects.json');
}

function readRegistry() {
  try {
    return JSON.parse(fs.readFileSync(registryPath(), 'utf8'));
  } catch {
    return { projects: [] };
  }
}

function writeRegistry(data) {
  fs.mkdirSync(registryDir(), { recursive: true });
  const tmpPath = `${registryPath()}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpPath, registryPath());
}

function idForPath(absPath) {
  return crypto.createHash('sha256').update(absPath).digest('hex').slice(0, 10);
}

/**
 * Bir projeyi merkezi kayda ekler (veya zaten kayitliysa gunceller).
 * `scaffold()` icinden (yani hem `postinstall` hem `init` komutundan)
 * cagrilir -- boylece kullanicidan ekstra bir "register" adimi istenmez.
 */
function registerProject(root) {
  const absRoot = path.resolve(root);
  const registry = readRegistry();
  const id = idForPath(absRoot);

  const existing = registry.projects.find((p) => p.id === id);
  if (existing) {
    existing.name = path.basename(absRoot);
    existing.lastSeenAt = new Date().toISOString();
  } else {
    registry.projects.push({
      id,
      name: path.basename(absRoot),
      path: absRoot,
      registeredAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    });
  }

  writeRegistry(registry);
  return id;
}

/**
 * Kayitli projeleri dondurur. Artik diskte var olmayan (silinmis/tasinmis)
 * proje yollari sessizce kayittan temizlenir -- boylece dashboard eski/olu
 * girdilerle dolmaz ve kullanicinin elle "unregister" yapmasi gerekmez.
 */
function listProjects() {
  const registry = readRegistry();
  const alive = registry.projects.filter((p) => fs.existsSync(path.join(p.path, '.memory')));

  if (alive.length !== registry.projects.length) {
    writeRegistry({ projects: alive });
  }

  return alive.sort((a, b) => (b.lastSeenAt || '').localeCompare(a.lastSeenAt || ''));
}

function getProject(id) {
  return listProjects().find((p) => p.id === id) || null;
}

module.exports = { registerProject, listProjects, getProject, registryPath, idForPath };
