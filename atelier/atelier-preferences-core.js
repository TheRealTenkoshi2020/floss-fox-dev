/* Floss Fox Atelier 3.9 reference: versioned local-only convenience state.
   No app data mutation; caller explicitly opts into saving. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FlossFoxAtelierPreferences = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const THEMES = ['system', 'morning', 'forest', 'moon'];
  const TABS = ['convert', 'threads', 'projects', 'shop', 'help', 'settings'];
  const VIEWS = ['list', 'grid', 'shelf'];
  const DEFAULT = Object.freeze({ v: 1, theme: 'system', rememberPlace: true, lastTab: 'convert', lastProjectId: null, collectionView: 'list', lowStockThreshold: 1, seasonalPip: false, recentConversions: [] });
  const code = v => typeof v === 'string' && /^[A-Za-z0-9-]{1,35}$/.test(v.trim()) ? v.trim().toUpperCase() : null;
  const brand = v => typeof v === 'string' && /^[A-Za-z0-9 -]{1,40}$/.test(v.trim()) ? v.trim().toUpperCase() : null;
  const projectId = v => typeof v === 'string' && v.length <= 80 && /^[\w.-]+$/.test(v) ? v : null;
  function conversion(v) {
    if (!v || typeof v !== 'object') return null;
    const from = brand(v.from), to = brand(v.to), c = code(v.code);
    if (!from || !to || !c) return null;
    const at = typeof v.at === 'string' && !Number.isNaN(Date.parse(v.at)) ? v.at.slice(0, 40) : '';
    return { from, to, code: c, at };
  }
  function normalize(raw) {
    const d = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    if (d.v > 1) return { ok: false, reason: 'future-schema', data: null };
    const o = { ...DEFAULT };
    if (THEMES.includes(d.theme)) o.theme = d.theme;
    if (typeof d.rememberPlace === 'boolean') o.rememberPlace = d.rememberPlace;
    if (TABS.includes(d.lastTab)) o.lastTab = d.lastTab;
    o.lastProjectId = projectId(d.lastProjectId);
    if (VIEWS.includes(d.collectionView)) o.collectionView = d.collectionView;
    if (Number.isInteger(d.lowStockThreshold) && d.lowStockThreshold >= 0 && d.lowStockThreshold <= 20) o.lowStockThreshold = d.lowStockThreshold;
    if (typeof d.seasonalPip === 'boolean') o.seasonalPip = d.seasonalPip;
    const seen = new Set();
    o.recentConversions = (Array.isArray(d.recentConversions) ? d.recentConversions : []).map(conversion).filter(x => {
      if (!x) return false;
      const k = `${x.from}|${x.to}|${x.code}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).slice(0, 12);
    return { ok: true, data: o };
  }
  function rememberConversion(current, row) {
    const p = normalize(current);
    if (!p.ok) return p;
    const c = conversion({ ...row, at: row && row.at || new Date().toISOString() });
    if (!c) return { ok: false, reason: 'invalid-conversion', data: p.data };
    const k = x => `${x.from}|${x.to}|${x.code}`;
    return normalize({ ...p.data, recentConversions: [c, ...p.data.recentConversions.filter(x => k(x) !== k(c))].slice(0, 12) });
  }
  function key(preview = false) { return `${preview ? 'flossfox-dev' : 'flossfox'}.atelier.v1`; }
  function load(storage, storageKey) {
    try {
      const raw = storage.getItem(storageKey);
      return raw === null ? normalize(null) : normalize(JSON.parse(raw));
    } catch (error) { return { ok: false, reason: 'unreadable', data: null }; }
  }
  function save(storage, storageKey, input) {
    const p = normalize(input);
    if (!p.ok) return p;
    try {
      const str = JSON.stringify(p.data);
      storage.setItem(storageKey, str);
      if (storage.getItem(storageKey) !== str) return { ok: false, reason: 'unverified-save', data: p.data };
      return p;
    } catch (error) { return { ok: false, reason: 'storage-unavailable', data: p.data }; }
  }
  return Object.freeze({ DEFAULT, normalize, rememberConversion, key, load, save, THEMES, TABS });
});
