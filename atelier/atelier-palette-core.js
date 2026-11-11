/* Floss Fox Atelier 3.9 reference: stable project color-strip data, read-only.
   RGB is optional approximate screen representation, never trusted color equivalence. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FlossFoxAtelierPalette = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const COLOR = /^#[0-9a-fA-F]{6}$/;
  function strip(projectItems, rgbByCode = {}, limit = 6) {
    if (!Array.isArray(projectItems)) throw new TypeError('Expected project items');
    const max = Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 12) : 6;
    const seen = new Set(), codes = [];
    for (const item of projectItems) {
      const code = typeof item?.code === 'string' ? item.code.trim().toUpperCase() : '';
      if (!code || seen.has(code)) continue;
      seen.add(code); codes.push(code);
    }
    const picks = codes.length <= max ? codes : Array.from({length: max}, (_,i) => codes[Math.floor(i * (codes.length - 1) / (max - 1 || 1))]);
    return { swatches: picks.map(code => ({ brand: 'DMC', code, rgb: COLOR.test(rgbByCode[code]) ? rgbByCode[code] : null, approximate: true })), total: codes.length, remaining: Math.max(0, codes.length - picks.length), note: 'Thread colors shown on screen are approximate.' };
  }
  return Object.freeze({ strip });
});
