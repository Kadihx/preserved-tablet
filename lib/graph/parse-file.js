'use strict';

const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const AST_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
const MAX_DESCRIPTION_LENGTH = 160;
const SKIP_PATTERNS = /copyright|spdx-license-identifier|@license|eslint-disable|prettier-ignore/i;

function canParse(filePath) {
  return AST_EXTENSIONS.has(path.extname(filePath));
}

/**
 * Bir node'a ait TUM leading comment'leri (satir ici // veya blok /** *\/)
 * tek, birlesik bir aciklamaya cevirir. ONEMLI: ardisik birden fazla `//`
 * satiri Babel tarafindan AYRI comment node'lari olarak tutulur -- sadece
 * ilkini/sonuncusunu almak cok satirli aciklamalari yarim keser, bu yuzden
 * dizideki TUM yorumlar birlestiriliyor.
 *
 * Amac: Claude'un "bu fonksiyon/dosya ne yapiyor" sorusunu dosyayi ACMADAN,
 * sadece graph-map.json'dan cevaplayabilmesi -- boylece proje anlama
 * asamasinda token harcayan dosya-okuma sayisi azalir. Lisans/eslint-disable
 * gibi anlamsiz yorumlar bilerek elenir.
 *
 * BILINEN SINIRLAMA: Babel "en yakin onceki yorum" sezgisiyle calisir --
 * dosyanin en ustunde degil de ilk fonksiyonun hemen ustunde duran genel bir
 * tasarim-notu yorumu, o fonksiyona ait sanilabilir. Bu heuristic bir
 * yaklasimin dogal bir sinirlamasidir; %100 dogruluk hedeflenmiyor, sadece
 * "hicbir aciklama yok"tan cok daha iyi bir baslangic noktasi hedefleniyor.
 */
function commentToDescription(commentNodes) {
  if (!commentNodes || commentNodes.length === 0) return null;

  const raw = commentNodes
    .map((c) =>
      c.value
        .split('\n')
        .map((line) => line.replace(/^\s*\*+\s?/, '').trim())
        .filter(Boolean)
        .join(' ')
    )
    .join(' ')
    .trim();

  if (!raw || SKIP_PATTERNS.test(raw)) return null;

  return raw.length > MAX_DESCRIPTION_LENGTH ? `${raw.slice(0, MAX_DESCRIPTION_LENGTH - 1)}…` : raw;
}

function dedupeByName(entries) {
  const seen = new Set();
  const out = [];
  for (const entry of entries) {
    if (seen.has(entry.name)) continue;
    seen.add(entry.name);
    out.push(entry);
  }
  return out;
}

/**
 * Tek bir kaynak dosyayi AST'ye cevirip import/export/fonksiyon/sinif
 * bilgilerini cikarir. Parse hatasi durumunda (gecersiz sozdizimi,
 * desteklenmeyen dil ozelligi vb.) sessizce bos sonuc + `error` alaniyla
 * doner -- tek bir bozuk dosya tum graph uretimini kirmamali.
 */
function parseFile(absPath) {
  const result = { imports: [], exports: [], functions: [], classes: [], fileDescription: null, error: null };

  let source;
  try {
    source = fs.readFileSync(absPath, 'utf8');
  } catch (err) {
    result.error = err.message;
    return result;
  }

  let ast;
  try {
    ast = parse(source, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'typescript'],
      errorRecovery: true,
    });
  } catch (err) {
    result.error = err.message;
    return result;
  }

  // Dosya-ustu yorum: program.body[0]'dan once gelen ilk yorum, genelde
  // dosyanin amacini aciklayan bir baslik yorumudur (@fileoverview, veya
  // basit bir aciklama satiri).
  const firstNode = ast.program.body[0];
  result.fileDescription = commentToDescription(firstNode && firstNode.leadingComments);

  try {
    traverse(ast, {
      ImportDeclaration(p) {
        result.imports.push(p.node.source.value);
      },
      ExportNamedDeclaration(p) {
        if (p.node.source) result.imports.push(p.node.source.value); // re-export: export { x } from './y'
        const decl = p.node.declaration;
        if (decl && decl.id) result.exports.push(decl.id.name);
        if (decl && decl.declarations) {
          decl.declarations.forEach((d) => {
            if (d.id && d.id.name) result.exports.push(d.id.name);
          });
        }
      },
      ExportDefaultDeclaration() {
        result.exports.push('default');
      },
      ExportAllDeclaration(p) {
        result.imports.push(p.node.source.value);
      },
      CallExpression(p) {
        // CommonJS: require('./foo')
        if (p.node.callee.type === 'Identifier' && p.node.callee.name === 'require') {
          const arg = p.node.arguments[0];
          if (arg && arg.type === 'StringLiteral') result.imports.push(arg.value);
        }
      },
      AssignmentExpression(p) {
        // CommonJS: module.exports = {...} / module.exports = X / module.exports.foo = X / exports.foo = X
        const left = p.node.left;
        if (left.type !== 'MemberExpression' || left.property.type !== 'Identifier') return;

        const obj = left.object;
        const isModuleExportsRoot =
          obj.type === 'MemberExpression' &&
          obj.object.type === 'Identifier' &&
          obj.object.name === 'module' &&
          obj.property.type === 'Identifier' &&
          obj.property.name === 'exports';
        const isModuleDotExports =
          obj.type === 'Identifier' && obj.name === 'module' && left.property.name === 'exports';
        const isExportsRoot = obj.type === 'Identifier' && obj.name === 'exports';

        if (isModuleDotExports) {
          const right = p.node.right;
          if (right.type === 'ObjectExpression') {
            right.properties.forEach((prop) => {
              const key = prop.key && (prop.key.name || prop.key.value);
              if (key) result.exports.push(key);
            });
          } else {
            result.exports.push('module.exports');
          }
        } else if (isModuleExportsRoot || isExportsRoot) {
          result.exports.push(left.property.name);
        }
      },
      FunctionDeclaration(p) {
        if (p.node.id) result.functions.push({ name: p.node.id.name, description: commentToDescription(p.node.leadingComments) });
      },
      ClassDeclaration(p) {
        if (p.node.id) result.classes.push({ name: p.node.id.name, description: commentToDescription(p.node.leadingComments) });
      },
    });
  } catch (err) {
    result.error = err.message;
  }

  result.imports = [...new Set(result.imports)];
  result.exports = [...new Set(result.exports)];
  result.functions = dedupeByName(result.functions);
  result.classes = dedupeByName(result.classes);

  return result;
}

module.exports = { parseFile, canParse, AST_EXTENSIONS };
