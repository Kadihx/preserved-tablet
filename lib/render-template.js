'use strict';

/**
 * Cok basit bir {{DEGISKEN}} sablon motoru. Buyuk bir templating kutuphanesine
 * gerek yok; sadece birkac sabit alani (GENERATED_AT gibi) enjekte ediyoruz.
 */
function renderTemplate(source, vars = {}) {
  return source.replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match;
  });
}

module.exports = { renderTemplate };
