'use strict';

const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const AST_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);

function canParse(filePath) {
  return AST_EXTENSIONS.has(path.extname(filePath));
}

/**
 * Tek bir kaynak dosyayi AST'ye cevirip import/export/fonksiyon/sinif
 * bilgilerini cikarir. Parse hatasi durumunda (gecersiz sozdizimi,
 * desteklenmeyen dil ozelligi vb.) sessizce bos sonuc + `error` alaniyla
 * doner -- tek bir bozuk dosya tum graph uretimini kirmamali.
 */
function parseFile(absPath) {
  const result = { imports: [], exports: [], functions: [], classes: [], error: null };

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
        if (p.node.id) result.functions.push(p.node.id.name);
      },
      ClassDeclaration(p) {
        if (p.node.id) result.classes.push(p.node.id.name);
      },
    });
  } catch (err) {
    result.error = err.message;
  }

  result.imports = [...new Set(result.imports)];
  result.exports = [...new Set(result.exports)];
  result.functions = [...new Set(result.functions)];
  result.classes = [...new Set(result.classes)];

  return result;
}

module.exports = { parseFile, canParse, AST_EXTENSIONS };
