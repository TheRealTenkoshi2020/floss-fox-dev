/* Floss Fox Atelier 3.9 reference: pure, read-only search over current app snapshots.
   UMD: browser window.FlossFoxAtelierSearch / Node require(). No localStorage, analytics or DOM. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FlossFoxAtelierSearch = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const canon = s => String(s == null ? '' : s).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
  const code = s => String(s == null ? '' : s).trim().toUpperCase();
  const valid = s => typeof s === 'string' && s.length > 0;
  const displayLocation = s => s && typeof s === 'object' ? [s.container, s.slot, s.medium].filter(valid).join(' · ').slice(0, 160) : '';
  function build({ projects = [], threads = {}, colors = [] } = {}) {
    if (!Array.isArray(projects) || !Array.isArray(colors)) throw new TypeError('Invalid search source');
    const t = threads && typeof threads === 'object' && !Array.isArray(threads) ? (threads.threads || threads) : {};
    if (!t || typeof t !== 'object' || Array.isArray(t)) throw new TypeError('Invalid thread collection');
    const out = [], seenColor = new Set();
    for (const p of projects) {
      if (!p || p.demo === true || !valid(p.id) || !valid(p.name)) continue;
      const codes = (Array.isArray(p.items) ? p.items : []).map(i => code(i && i.code)).filter(Boolean);
      const subtitle = [p.status || 'planning', `${codes.length} colors`].join(' · ');
      out.push({ type: 'project', key: p.id, label: p.name.slice(0, 100), subtitle, terms: canon(`${p.name} ${codes.join(' ')}`), exactCode: '' });
    }
    for (const [raw, entry] of Object.entries(t)) {
      const c = code(raw);
      if (!c || !entry || typeof entry !== 'object') continue;
      const loc = displayLocation(entry.storage);
      const n = Number.isInteger(entry.n) && entry.n >= 0 ? entry.n : 0;
      const partial = entry.partial === true;
      out.push({ type: 'thread', key: `DMC:${c}`, label: `DMC ${c}`, subtitle: `${n} full skeins${partial ? ' + partial' : ''}${loc ? ` · ${loc}` : ''}`, terms: canon(`DMC ${c} ${loc}`), exactCode: c });
    }
    for (const row of colors) {
      if (!row || !valid(String(row.code || ''))) continue;
      const brand = valid(row.brand) ? row.brand.trim().toUpperCase() : 'DMC';
      const c = code(row.code);
      const k = `${brand}:${c}`;
      if (seenColor.has(k)) continue;
      seenColor.add(k);
      const name = valid(row.name) ? row.name.trim().slice(0, 120) : '';
      out.push({ type: 'color', key: k, label: `${brand} ${c}`, subtitle: name, terms: canon(`${brand} ${c} ${name}`), exactCode: c });
    }
    return out;
  }
  function search(index, rawQuery, options = {}) {
    if (!Array.isArray(index)) throw new TypeError('Index must be an array');
    const q = canon(String(rawQuery == null ? '' : rawQuery).slice(0, 120));
    const empty = { projects: [], threads: [], colors: [], total: 0, query: q };
    if (!q) return empty;
    const tokens = q.split(' ').filter(Boolean), limit = Number.isInteger(options.limit) && options.limit >= 1 ? Math.min(30, options.limit) : 8;
    const ranked = [];
    for (const row of index) {
      if (!row || !['project', 'thread', 'color'].includes(row.type)) continue;
      const name = canon(row.label), hay = `${name} ${row.terms || ''} ${canon(row.subtitle)}`;
      if (!tokens.every(t => hay.includes(t))) continue;
      const exact = canon(row.exactCode) === q || name === q;
      const prefix = name.startsWith(q) || canon(row.exactCode).startsWith(q);
      ranked.push({ ...row, _rank: exact ? 0 : prefix ? 1 : 2 });
    }
    ranked.sort((a, b) => a._rank - b._rank || a.label.localeCompare(b.label, undefined, {numeric: true}) || a.key.localeCompare(b.key));
    const out = { ...empty, total: ranked.length };
    for (const row of ranked) {
      const bucket = row.type === 'project' ? out.projects : row.type === 'thread' ? out.threads : out.colors;
      if (bucket.length < limit) { const { _rank, ...publicRow } = row; bucket.push(publicRow); }
    }
    return out;
  }
  return Object.freeze({ build, search, displayLocation });
});
