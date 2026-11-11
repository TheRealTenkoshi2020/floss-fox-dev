/* Floss Fox 3.9 Atelier: read-only color studio + project chart-match surface (FF39-09).
   Labels come from FlossFoxAtelierCompare + Pixel studio.* copy. No inventory or project writes. */
(function (root) {
  'use strict';
  const PH = {
    'studio.whites.title': 'The whites are not the same',
    'studio.whites.body': 'These are separate DMC colors. On screen they look alike, so check the number.',
    'studio.match.none': 'No chart match',
    'studio.dest.in': '{source} in {brand}'
  };
  const $ = id => document.getElementById(id);
  const t = (k, v) => {
    const CP = root.FlossFoxAtelierCopy;
    if (CP && typeof CP.has === 'function' && CP.has(k) && typeof CP.t === 'function') return CP.t(k, v);
    return String(PH[k] || '').replace(/\{(\w+)\}/g, (m, x) => (v && x in v) ? String(v[x]) : m);
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const C = () => root.FlossFoxAtelierCompare;
  const hexOf = (DMC, code) => {
    const e = DMC && DMC[code];
    return e && typeof e.hex === 'string' && /^#[0-9a-fA-F]{6}$/.test(e.hex) ? e.hex : null;
  };
  const swatch = (hex, label, extra) => {
    const h = hex || 'transparent';
    const edge = !hex || (() => {
      if (!hex) return true;
      const ch = i => { const v = parseInt(hex.slice(i, i + 2), 16) / 255; const n = v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); return n; };
      const L = 0.2126 * ch(1) + 0.7152 * ch(3) + 0.0722 * ch(5);
      return L > 0.8 || L < 0.02;
    })();
    return `<span class="ffa-floss ffa-cmp-floss${edge ? ' is-edge' : ''}${hex ? '' : ' is-empty'}" style="${hex ? '--c:' + hex : ''}" role="img" aria-label="${esc(label)}"></span>`;
  };
  const kindBadge = kind => {
    const key = kind === 'exact' ? 'studio.match.exact' : kind === 'close' ? 'studio.match.close' : 'studio.match.est';
    const lab = t(key) || kind;
    return `<span class="ffa-kind ffa-kind-${kind}">${esc(lab)}</span>`;
  };
  const why = kind => {
    const key = kind === 'exact' ? 'studio.why.exact' : kind === 'close' ? 'studio.why.close' : 'studio.why.est';
    return t(key);
  };
  const brandName = d => d === 'sullivans' ? 'Sullivans' : d === 'anchor' ? 'Anchor' : 'DMC';
  const chartsOf = (DMC, SULL, code) => ({
    anchor: (DMC && DMC[code] && Array.isArray(DMC[code].anchor)) ? DMC[code].anchor : [],
    sullivans: SULL || {}
  });

  function paint(ctx) {
    const Cmp = C();
    if (!Cmp || !ctx) return;
    const { items, dest, DMC, SULL, choice } = ctx;
    const results = $('results') || ctx.host;
    if (!results) return;
    let host = $('ffStudio');
    if (!host) {
      host = document.createElement('section');
      host.id = 'ffStudio';
      host.className = 'ffa-studio noprint';
      host.setAttribute('aria-labelledby', 'ffStudioH');
      const tbl = $('tbl') || ctx.table;
      if (tbl && tbl.parentNode === results) results.insertBefore(host, tbl);
      else results.appendChild(host);
    }
    if (!items || !items.length) { host.hidden = true; host.innerHTML = ''; return; }
    host.hidden = false;
    const srcLab = t('studio.source') || 'Your color';
    const caveat = t('studio.caveat');
    const screen = t('studio.screen');
    const destBrand = brandName(dest);
    const cards = items.map(it => {
      const code = it.code;
      const entry = DMC && DMC[code];
      const name = entry && entry.name ? entry.name : '';
      const srcHex = hexOf(DMC, code);
      const matches = Cmp.matchesFor(code, dest, chartsOf(DMC, SULL, code), choice && choice[code]);
      const title = t('studio.dest.in', { source: 'DMC ' + code, brand: destBrand }) || (`DMC ${code} in ${destBrand}`);
      const cols = [`<div class="ffa-cmpcol is-src">${swatch(srcHex, 'DMC ' + code + ' swatch, approximate')}<span class="ffa-ccode">DMC ${esc(code)}</span><span class="ffa-cname">${esc(name)}${name ? ' · ' : ''}${esc(srcLab)}</span>${dest === 'dmc' ? kindBadge('exact') : ''}</div>`];
      const shown = matches.filter(m => !m.source);
      if (dest !== 'dmc' && !shown.length) {
        cols.push(`<div class="ffa-cmpcol is-empty"><span class="ffa-ccode">${esc(t('studio.match.none') || 'No chart match')}</span></div>`);
      } else {
        shown.forEach(m => {
          const mHex = (m.brand === 'DMC') ? hexOf(DMC, m.code) : null; // we do not invent chart-brand RGB
          cols.push(`<div class="ffa-cmpcol${m.selected ? ' is-sel' : ''}">${swatch(mHex, mHex ? (m.brand + ' ' + m.code + ' swatch, approximate') : ('No ' + m.brand + ' swatch available'))}<span class="ffa-ccode">${esc(m.brand)} ${esc(m.code)}</span>${kindBadge(m.kind)}<span class="ffa-cname">${esc(why(m.kind))}</span></div>`);
        });
      }
      return `<article class="ffa-cmp" data-code="${esc(code)}" aria-label="${esc(title)}"><div class="ffa-cmp-head"><h3 class="ffa-cmp-h">${esc(title)}</h3></div><div class="ffa-cmp-grid">${cols.join('')}</div></article>`;
    }).join('');
    const seenWhite = items.some(it => Cmp.isWhite(it.code));
    const whites = Cmp.WHITES.map(code => {
      const entry = DMC && DMC[code];
      return `<div class="ffa-wcard">${swatch(hexOf(DMC, code), 'DMC ' + code + ' swatch, approximate')}<span class="ffa-ccode">DMC ${esc(code)}</span><span class="ffa-cname">${esc(entry && entry.name ? entry.name : '')}</span></div>`;
    }).join('');
    const whiteBlock = seenWhite ? `<section class="ffa-whites" aria-labelledby="ffWhitesH"><h3 id="ffWhitesH">${esc(t('studio.whites.title'))}</h3><p class="mut small">${esc(t('studio.whites.body'))}</p><div class="ffa-wgrid">${whites}</div></section>` : '';
    host.innerHTML = `<div class="ffa-studio-head"><h2 id="ffStudioH">${esc(t('studio.btn.compare') || 'Compare chart matches')}</h2><p class="mut small" id="ffStudioCaveat">${esc(caveat)}</p><p class="mut small">${esc(screen)}</p></div>${cards}${whiteBlock}`;
  }

  function paintProject(el, p, DMC, SULL) {
    const Cmp = C();
    if (!el || !p || !Cmp) return;
    if (!p.items || !p.items.length) { el.innerHTML = ''; return; }
    const dest = (p.buyBrand || 'dmc');
    const rows = p.items.map(it => {
      const matches = Cmp.matchesFor(it.code, dest, chartsOf(DMC, SULL, it.code), null).filter(m => dest === 'dmc' ? m.source : !m.source);
      const bits = matches.length ? matches.map(m => `${esc(m.brand)} ${esc(m.code)} ${kindBadge(m.kind)}`).join(' ') : esc(t('studio.match.none') || 'No chart match');
      return `<li class="ffa-pcc-row"><span class="ffa-ccode">DMC ${esc(it.code)}</span><span class="ffa-pcc-m">${bits}</span></li>`;
    }).join('');
    el.innerHTML = `<div class="ffa-pcc"><h3>${esc(t('studio.btn.compare') || 'Compare chart matches')}</h3><p class="hint">${esc(t('studio.caveat'))}</p><ul class="ffa-pcc-list">${rows}</ul></div>`;
  }

  root.FlossFoxAtelierStudio = Object.freeze({ paint, paintProject, PH });
})(typeof window !== 'undefined' ? window : globalThis);
