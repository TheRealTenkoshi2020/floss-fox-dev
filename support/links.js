/* Floss Fox optional support links (DEV PREVIEW, 3.9 monetization).
   Adapted from the Monetization Launch Kit reference (support-links.js), with fixes.

   THE ONE PLACE TO CONFIGURE: SUPPORT_URL and PACK_URL below.
   Both are EMPTY on purpose. While a URL is empty or fails the checks, its link is not shown,
   and if both are empty nothing at all appears (no section, no footer link, no dead button).
   Paste ONLY the exact URLs Myke has verified with a real checkout:
     SUPPORT_URL: his Ko-fi page, e.g. https://ko-fi.com/<his-page>
     PACK_URL:    the Ko-fi shop item for the $7 printable, e.g. https://ko-fi.com/s/<item-id>
   (A Stripe Payment Link https://buy.stripe.com/<id> is also accepted.)

   Safety rules this file keeps:
   - Plain links only. No payment-provider scripts, iframes, widgets, cookies or pop-ups.
   - Exact host allowlist (ko-fi.com, buy.stripe.com). https only, no port, no user:password,
     a real path, and NO query string or #fragment (so no tracking or prefill parameters can ride along).
   - The URL is used exactly as configured. Nothing from projects, threads, notes or storage is added.
   - Never reads or writes localStorage/sessionStorage. No analytics events.
   - Never shows a payment success. The provider confirms purchases, not Floss Fox.
   - Offline: says the links need internet; a tap while offline shows that message instead of opening a dead tab. */
(function (root, factory) {
  'use strict';
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FlossFoxSupport = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  // ===== Configuration (owner-verified URLs only; leave empty to hide) =====
  var SUPPORT_URL = '';
  var PACK_URL = '';
  var PACK_PRICE = '$7';
  // ==========================================================================

  // Exact hostnames only. No subdomain wildcards. Adding a provider is a code change plus review.
  var PROVIDERS = { 'ko-fi.com': 'Ko-fi', 'buy.stripe.com': 'Stripe' };

  // ALL user-facing strings live here and nowhere else (swap-in point for Pixel's SUPPORT.md).
  // STATUS: PENDING PIXEL. Cleaned-up kit copy (no em dashes, no spaced hyphens, straight apostrophes).
  var COPY = {
    title: "Keep Pip's lantern glowing",
    intro: 'Floss Fox is free and private, and every feature stays free. If it has helped your stitching, you can leave an optional tip or pick up the printable Stitching Atelier Companion.',
    tip: 'Leave a tip',
    pack: function (price) { return 'Get the printable companion (' + price + ')'; },
    external: function (names) { return 'Opens ' + names + ' checkout in a new tab. Checkout needs an internet connection.'; },
    fine: function (names) {
      return 'Optional. Paying or not paying changes nothing in Floss Fox. ' + names +
        ' handles payment and delivery and may collect your name, email and payment details under its own privacy policy. ' +
        'Floss Fox never sees your payment details and sends nothing from your projects or collection. ' +
        'Tips support a software project and are not charitable or tax-deductible donations.';
    },
    offline: "You're offline. These links will work when you're back online.",
    footer: 'Support Floss Fox',
    aria: function (label, provider) { return label + ' (opens ' + provider + ' checkout in a new tab)'; }
  };

  function safeCheckoutUrl(raw) {
    if (typeof raw !== 'string') return null;
    var t = raw.trim();
    if (!t || t.length > 2048 || /\s/.test(t)) return null;
    var u;
    try { u = new URL(t); } catch (_) { return null; }
    if (u.protocol !== 'https:' || u.username || u.password || u.port) return null;
    var host = u.hostname.toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(PROVIDERS, host)) return null;
    if (u.search || u.hash || t.indexOf('?') >= 0 || t.indexOf('#') >= 0) return null; // no tracking/prefill params
    if (!u.pathname || u.pathname === '/' || u.pathname.length < 2) return null; // bare homepage is not a checkout
    return u.href;
  }

  function providerName(href) {
    try { return PROVIDERS[new URL(href).hostname.toLowerCase()] || ''; } catch (_) { return ''; }
  }

  function safePrice(p) {
    return typeof p === 'string' && /^\$\d{1,3}(?:\.\d{2})?$/.test(p) ? p : '$7';
  }

  function joinNames(list) {
    var u = list.filter(function (n, i) { return n && list.indexOf(n) === i; });
    return u.length > 1 ? u.slice(0, -1).join(', ') + ' or ' + u[u.length - 1] : (u[0] || 'the provider');
  }

  function viewModel(config) {
    config = config && typeof config === 'object' ? config : {};
    var support = safeCheckoutUrl(config.supportUrl);
    var pack = safeCheckoutUrl(config.packUrl);
    var price = safePrice(config.packPrice);
    var items = [];
    if (support) items.push({ kind: 'tip', href: support, label: COPY.tip, provider: providerName(support) });
    if (pack) items.push({ kind: 'pack', href: pack, label: COPY.pack(price), provider: providerName(pack) });
    var names = joinNames(items.map(function (i) { return i.provider; }));
    return {
      show: items.length > 0,
      support: items.filter(function (i) { return i.kind === 'tip'; })[0] || null,
      pack: items.filter(function (i) { return i.kind === 'pack'; })[0] || null,
      items: items,
      providers: names,
      note: 'Floss Fox stays free. Supporting is optional and never changes your projects or collection.'
    };
  }

  // Config in use: the constants above. Tests may set window.__FF_SUPPORT_TEST before load
  // (same pattern as review.js); it still goes through every check above.
  function currentConfig() {
    var o = root && root.__FF_SUPPORT_TEST;
    if (o && typeof o === 'object') return { supportUrl: o.supportUrl, packUrl: o.packUrl, packPrice: PACK_PRICE };
    return { supportUrl: SUPPORT_URL, packUrl: PACK_URL, packPrice: PACK_PRICE };
  }

  function isOffline(win) {
    try { return !!(win && win.navigator && win.navigator.onLine === false); } catch (_) { return false; }
  }

  // Renders one support section into host. `name` makes ids unique per mount (e.g. "settings", "about").
  function render(host, config, doc, name) {
    if (!host || !doc || typeof doc.createElement !== 'function') return false;
    var v = viewModel(config);
    if (!v.show) { if (host.replaceChildren) host.replaceChildren(); return false; }
    var slug = String(name || 'main').replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'main';
    var win = doc.defaultView || null;
    var section = doc.createElement('section');
    section.className = 'ff-support';
    section.id = 'ffSupport-' + slug;
    section.setAttribute('aria-labelledby', 'ffSupportTitle-' + slug);
    var h = doc.createElement('h3'); h.id = 'ffSupportTitle-' + slug; h.textContent = COPY.title;
    var intro = doc.createElement('p'); intro.textContent = COPY.intro;
    var links = doc.createElement('div'); links.className = 'ff-support-links';
    var status = doc.createElement('p'); status.className = 'ff-support-offline'; status.id = 'ffSupportOffline-' + slug;
    status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    v.items.forEach(function (it) {
      var a = doc.createElement('a');
      a.href = it.href; a.textContent = it.label;
      a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.referrerPolicy = 'no-referrer';
      a.className = 'ff-support-link ff-support-' + it.kind;
      a.setAttribute('data-kind', it.kind);
      a.setAttribute('aria-label', COPY.aria(it.label, it.provider));
      a.addEventListener('click', function (e) {
        if (isOffline(win)) { e.preventDefault(); status.textContent = COPY.offline; }
      });
      links.appendChild(a);
    });
    var ext = doc.createElement('p'); ext.className = 'ff-support-external'; ext.textContent = COPY.external(v.providers);
    var fine = doc.createElement('p'); fine.className = 'ff-support-note'; fine.textContent = COPY.fine(v.providers);
    function sync() { status.textContent = isOffline(win) ? COPY.offline : ''; }
    sync();
    if (win && win.addEventListener && !host.__ffSupportBound) {
      host.__ffSupportBound = true;
      win.addEventListener('online', function () { var s = host.querySelector('.ff-support-offline'); if (s) s.textContent = ''; });
      win.addEventListener('offline', function () { var s = host.querySelector('.ff-support-offline'); if (s) s.textContent = COPY.offline; });
    }
    section.append(h, intro, links, ext, status, fine);
    host.replaceChildren(section);
    return true;
  }

  // Footer: one small in-app link to the About page section (never straight to checkout),
  // so the external-checkout notice is always seen first.
  function renderFooter(doc, config, href) {
    var old = doc.getElementById('ffSupportFooter'); if (old) old.remove();
    if (!viewModel(config).show) return false;
    var foot = doc.querySelector('footer .footlinks');
    if (!foot) return false;
    var span = doc.createElement('span'); span.id = 'ffSupportFooter';
    span.appendChild(doc.createTextNode(' \u00b7 '));
    var a = doc.createElement('a'); a.href = href || 'about.html#support'; a.textContent = COPY.footer;
    span.appendChild(a);
    // Sit right after "Backup and settings" (before the closing privacy sentence) when present.
    var after = foot.querySelector('.ffsettingslink');
    if (after && after.parentNode === foot) foot.insertBefore(span, after.nextSibling);
    else foot.appendChild(span);
    return true;
  }

  function mountAll() {
    if (typeof document === 'undefined') return;
    var cfg = currentConfig();
    // Settings: create the mount at the end of the Settings card (no edit to the big Settings markup line,
    // which keeps merges with other 3.9 branches clean). Removed again if nothing is configured.
    var sc = document.querySelector('#settingsView .card');
    var sm = document.querySelector('[data-ff-support-mount="settings"]');
    if (sc && !sm && viewModel(cfg).show) {
      sm = document.createElement('div'); sm.setAttribute('data-ff-support-mount', 'settings'); sc.appendChild(sm);
    }
    var nodes = document.querySelectorAll('[data-ff-support-mount]');
    for (var i = 0; i < nodes.length; i++) {
      var shown = render(nodes[i], cfg, document, nodes[i].getAttribute('data-ff-support-mount'));
      if (!shown && nodes[i].getAttribute('data-ff-support-mount') === 'settings') nodes[i].remove();
    }
    renderFooter(document, cfg);
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll);
    else mountAll();
  }

  return Object.freeze({
    safeCheckoutUrl: safeCheckoutUrl, viewModel: viewModel, render: render, renderFooter: renderFooter,
    mount: mountAll, config: currentConfig, PROVIDERS: Object.freeze(Object.assign({}, PROVIDERS)), COPY: COPY
  });
});
