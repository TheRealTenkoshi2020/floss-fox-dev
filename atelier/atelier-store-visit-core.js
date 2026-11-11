/* Floss Fox Atelier 3.9 reference: canonical shopping lines, nonduplicated store grouping.
   Read-only: never purchases, never increments inventory, never opens a merchant. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FlossFoxAtelierStoreVisit = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const clean = x => String(x == null ? '' : x).trim();
  const code = x => clean(x).toUpperCase();
  const cmp = (a, b) => a.localeCompare(b, undefined, { numeric: true });
  function build(lines, merchantLinks = [], options = {}) {
    if (!Array.isArray(lines) || !Array.isArray(merchantLinks)) throw new TypeError('Invalid inputs');
    const filter = ['all', 'remaining', 'purchased'].includes(options.filter) ? options.filter : 'all';
    const query = clean(options.query).toLowerCase().slice(0, 120);
    const selected = clean(options.selectedMerchant);
    const view = options.view === 'by-store' ? 'by-store' : 'checklist';
    const seen = new Set(), normalized = [];
    for (const line of lines) {
      if (!line || typeof line !== 'object' || !clean(line.key) || seen.has(line.key)) throw new TypeError('Shopping line needs unique key');
      const c = code(line.code || line.to), b = code(line.brand || 'DMC');
      const q = line.quantity === undefined ? line.q : line.quantity;
      if (!c || !b || !Number.isInteger(q) || q < 1 || q > 9999) throw new TypeError('Invalid line');
      seen.add(line.key);
      normalized.push({ key: line.key, brand: b, code: c, quantity: q, bought: line.bought === true, name: clean(line.name).slice(0, 120) });
    }
    const byColor = new Map();
    for (const link of merchantLinks) {
      if (!link || link.verified !== true || !clean(link.merchantId) || !clean(link.code)) continue; // upstream gate is authoritative
      const k = `${code(link.brand || 'DMC')}|${code(link.code)}`;
      const x = byColor.get(k) || new Map();
      if (!x.has(link.merchantId)) x.set(link.merchantId, { id: link.merchantId, name: clean(link.merchantName || link.merchantId) });
      byColor.set(k, x);
    }
    const withStores = normalized.map(line => ({ ...line, stores: [...(byColor.get(`${line.brand}|${line.code}`) || new Map()).values()].sort((a,b)=>cmp(a.name,b.name)) }));
    const filtered = withStores.filter(x => (filter === 'all' || (filter === 'purchased') === x.bought) && (!query || `${x.brand} ${x.code} ${x.name}`.toLowerCase().includes(query)));
    const groups = new Map();
    const put = (key, label, line) => { if (!groups.has(key)) groups.set(key, { key, label, items: [] }); groups.get(key).items.push(line); };
    if (view === 'by-store') {
      for (const line of filtered) {
        const possible = selected ? line.stores.find(x => x.id === selected) : line.stores[0];
        if (possible) put(possible.id, possible.name, line);
        else put('unassigned', 'Other / find in store', line);
      }
    } else {
      for (const line of filtered) put('checklist', 'Shopping checklist', line);
    }
    const sorted = [...groups.values()].sort((a,b) => a.key === 'unassigned' ? 1 : b.key === 'unassigned' ? -1 : cmp(a.label,b.label));
    for (const g of sorted) g.items.sort((a,b)=>cmp(a.brand,b.brand)||cmp(a.code,b.code));
    return {
      groups: sorted,
      counts: { total: normalized.length, remaining: normalized.filter(x=>!x.bought).length, bought: normalized.filter(x=>x.bought).length, visible: filtered.length },
      warning: 'Marking bought does not change inventory. Receipt and quantity must be confirmed separately.',
      selectedMerchant: selected || null
    };
  }
  function shareText(lines, options = {}) {
    const v = build(lines, [], { filter: options.filter || 'remaining' });
    const all = v.groups.flatMap(g => g.items);
    return ['Floss Fox shopping list', ...all.map(x => `${x.brand} ${x.code} — ${x.quantity} skein${x.quantity === 1 ? '' : 's'}${x.name ? ` — ${x.name}` : ''}`), ...(all.length ? [] : ['No threads to buy.']), 'Check quantities and alternatives before buying.'].join('\n');
  }
  return Object.freeze({ build, shareText });
});
