/* Floss Fox 3.9 Atelier: read-only color studio + project chart-match surface (FF39-09).
   Labels come from FlossFoxAtelierCompare + Pixel studio.* copy. No inventory or project writes. */
(function (root) {
  'use strict';
  const PH = {
    'studio.whites.title': 'The whites are not the same',
    'studio.whites.body': 'These are separate DMC colors. On screen they look alike, so check the number.',
    'studio.match.none': 'No chart match',
    'studio.dest.in': '{source} in {brand}',
    'studio.use.radio': 'Use {brand} {code}',
    'studio.recent.chip': 'DMC {code} · {brand}',
    'studio.match.legend': 'Choose a match for DMC {code}',
    'studio.swatch.none': 'No {brand} swatch available'
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
  const swatch = (hex, label) => {
    return `<span class="ffa-floss ffa-cmp-floss${hex ? '' : ' is-empty'}" style="${hex ? '--c:' + hex : ''}" role="img" aria-label="${esc(label)}"></span>`;
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
      const canPick = dest !== 'dmc' && shown.length > 1;
      if (dest !== 'dmc' && !shown.length) {
        cols.push(`<div class="ffa-cmpcol is-empty"><span class="ffa-ccode">${esc(t('studio.match.none') || 'No chart match')}</span></div>`);
      } else {
        shown.forEach(m => {
          const noneLab = t('studio.swatch.none', { brand: m.brand }) || ('No ' + m.brand + ' swatch available');
          const radio = canPick ? `<label class="ffa-choose"><input type="radio" name="ffa-m-${esc(code)}" data-code="${esc(code)}" value="${esc(m.code)}"${m.selected ? ' checked' : ''}> ${esc(t('studio.use.radio', { brand: m.brand, code: m.code }) || ('Use ' + m.brand + ' ' + m.code))}</label>` : '';
          cols.push(`<div class="ffa-cmpcol${m.selected ? ' is-sel' : ''}">${swatch(null, noneLab)}<span class="ffa-ccode">${esc(m.brand)} ${esc(m.code)}</span>${kindBadge(m.kind)}<span class="ffa-cname">${esc(why(m.kind))}</span>${radio}</div>`);
        });
      }
      const legend = canPick ? `<legend class="sr">${esc(t('studio.match.legend', { code }) || ('Choose a match for DMC ' + code))}</legend>` : '';
      const wrapOpen = canPick ? `<fieldset class="ffa-cmp-fs">${legend}` : '';
      const wrapClose = canPick ? `</fieldset>` : '';
      return `<article class="ffa-cmp" data-code="${esc(code)}" aria-label="${esc(title)}"><div class="ffa-cmp-head"><h3 class="ffa-cmp-h">${esc(title)}</h3></div>${wrapOpen}<div class="ffa-cmp-grid">${cols.join('')}</div>${wrapClose}</article>`;
    }).join('');
    const seenWhite = items.some(it => Cmp.isWhite(it.code));
    const whites = Cmp.WHITES.map(code => {
      const entry = DMC && DMC[code];
      return `<div class="ffa-wcard">${swatch(hexOf(DMC, code), 'DMC ' + code + ' swatch, approximate')}<span class="ffa-ccode">DMC ${esc(code)}</span><span class="ffa-cname">${esc(entry && entry.name ? entry.name : '')}</span></div>`;
    }).join('');
    const whiteBlock = seenWhite ? `<section class="ffa-whites" aria-labelledby="ffWhitesH"><h3 id="ffWhitesH">${esc(t('studio.whites.title'))}</h3><p class="mut small">${esc(t('studio.whites.body'))}</p><div class="ffa-wgrid">${whites}</div></section>` : '';
    const recent = recentBlock(DMC, dest);
    host.innerHTML = `<div class="ffa-studio-head"><h2 id="ffStudioH">${esc(t('studio.title') || t('studio.btn.compare') || 'Compare chart matches')}</h2><p class="mut small">${esc(t('studio.sub'))}</p><p class="mut small" id="ffStudioCaveat">${esc(caveat)}</p><p class="mut small">${esc(screen)}</p></div>${cards}${whiteBlock}${recent}`;
    host.querySelectorAll('.ffa-choose input').forEach(r => {
      r.addEventListener('change', () => {
        if (choice) choice[r.dataset.code] = r.value || undefined;
        const sel = document.querySelector('.pick[data-code="' + CSS.escape(r.dataset.code) + '"]');
        if (sel) { sel.value = r.value; sel.dispatchEvent(new Event('change')); }
        paint(ctx);
      });
    });
  }
  function recentBlock(DMC, dest) {
    const prefs = root.FlossFoxAtelier && typeof root.FlossFoxAtelier.prefs === 'function' ? root.FlossFoxAtelier.prefs() : null;
    const rows = prefs && Array.isArray(prefs.recentConversions) ? prefs.recentConversions : [];
    const brandN = b => b === 'sullivans' ? 'Sullivans' : b === 'anchor' ? 'Anchor' : 'DMC';
    const items = rows.slice(0, 12).map(row => {
      const hex = hexOf(DMC, row.code);
      const chip = t('studio.recent.chip', { code: row.code, brand: brandN(row.to) }) || ('DMC ' + row.code + ' · ' + brandN(row.to));
      const aria = t('studio.recent.item', { brand: 'DMC', code: row.code, brand2: brandN(row.to) }) || ('Convert DMC ' + row.code + ' to ' + brandN(row.to) + ' again');
      return `<li><a href="#ffStudio" aria-label="${esc(aria)}">${swatch(hex, 'DMC ' + row.code + ' swatch, approximate')}${esc(chip)}</a></li>`;
    }).join('');
    const body = items ? `<ul class="ffa-recent">${items}</ul>` : `<p class="mut small">${esc(t('studio.recent.empty'))}</p>`;
    return `<section class="ffa-recent-wrap" aria-labelledby="ffRecentH"><h3 id="ffRecentH">${esc(t('studio.recent.title'))}</h3><p class="mut small">${esc(t('studio.recent.hint'))}</p>${body}</section>`;
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
