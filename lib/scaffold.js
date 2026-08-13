'use strict';

const fs = require('fs');
const path = require('path');

const { resolveConsumerRoot } = require('./paths');
const { renderTemplate } = require('./render-template');
const { registerProject } = require('./registry');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

function readTemplate(name) {
  return fs.readFileSync(path.join(TEMPLATES_DIR, name), 'utf8');
}

/**
 * Hedef dosya zaten varsa DOKUNMAZ. Bu idempotency kritik: postinstall her
 * `npm install` calismasinda tekrar tetiklenir (yeni bagimlilik ekleme, CI
 * rebuild, node_modules silinip yeniden kurulma vb.) ve gelistiricinin/Claude'un
 * elle duzenledigi .memory/context.md gibi dosyalari sessizce ezmek ciddi bir
 * veri kaybi hatasi olur.
 */
function copyIfAbsent(templateName, dest, vars) {
  if (fs.existsSync(dest)) {
    return false;
  }
  const rendered = renderTemplate(readTemplate(templateName), vars);
  fs.writeFileSync(dest, rendered, 'utf8');
  return true;
}

function nowISO() {
  return new Date().toISOString();
}

/**
 * Tuketici proje kokune .memory/ dizinini ve Claude Code kural dosyasini kurar.
 * Tamami idempotent: birden fazla kez calistirmak guvenlidir.
 */
async function scaffold() {
  const root = resolveConsumerRoot();
  const generatedAt = nowISO();

  const memoryDir = path.join(root, '.memory');
  fs.mkdirSync(memoryDir, { recursive: true });

  const createdFiles = [];
  const track = (created, dest) => {
    if (created) createdFiles.push(dest);
  };

  track(
    copyIfAbsent('context.md.template', path.join(memoryDir, 'context.md'), {
      GENERATED_AT: generatedAt,
    }),
    path.join(memoryDir, 'context.md')
  );

  track(
    copyIfAbsent('graph-map.template.json', path.join(memoryDir, 'graph-map.json'), {
      GENERATED_AT: generatedAt,
    }),
    path.join(memoryDir, 'graph-map.json')
  );

  track(copyIfAbsent('ai-rules.md', path.join(memoryDir, 'ai-rules.md')), path.join(memoryDir, 'ai-rules.md'));

  track(
    copyIfAbsent('memory-gitignore', path.join(memoryDir, '.gitignore')),
    path.join(memoryDir, '.gitignore')
  );

  const claudeRulesDir = path.join(root, '.claude', 'rules');
  fs.mkdirSync(claudeRulesDir, { recursive: true });
  track(
    copyIfAbsent('claude-rule.md', path.join(claudeRulesDir, 'preserved-tablet.md')),
    path.join(claudeRulesDir, 'preserved-tablet.md')
  );

  // Merkezi kayda ekle (kullanicinin home dizininde, ~/.preserved-tablet/) --
  // boylece proje "npx preserved-tablet dashboard" panelinde otomatik gorunur.
  // Kaydin kendisi kritik degil, basarisiz olursa scaffold'u kirmasin.
  try {
    registerProject(root);
  } catch (err) {
    console.warn('[preserved-tablet] merkezi panele kayit atlandi:', err.message);
  }

  return { root, memoryDir, createdFiles };
}

module.exports = { scaffold, copyIfAbsent };
