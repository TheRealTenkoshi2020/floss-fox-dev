/* Floss Fox: unfinished-list recovery for Find floss (adapted from Samira's FTUX candidate ftux-draft-ui.js).
 * Load AFTER the index inline script, confirm.js, projects.js, threads.js and ftux-draft-core.js.
 * Keeps raw pasted text (malformed lines too) in its own key, <prefix>.scratch.v1. Never writes projects or threads,
 * never saves example-mode text, never overwrites an unreadable or newer draft. Not part of backups (said in the card). */
(function () {
  'use strict';
  if (window.FlossFoxDraftUI) return; // no double wiring
  const C = window.FlossFoxDraftCore, P = window.FlossFoxProjects;
  const box = document.getElementById('inp'), brand = document.getElementById('dest');
  if (!C || !P || !box || !brand) return;
  const key = P.KEY.replace(/\.v1$/, '') + '.scratch.v1';
  const storage = {getItem: k => localStorage.getItem(k), setItem: (k, v) => localStorage.setItem(k, v), removeItem: k => localStorage.removeItem(k)};
  const S = C.store(storage, key);
  const demo = () => { const b = document.getElementById('exampleBanner'); return !!b && !b.hidden; };
  let blocked = false, timer = null, committedText = null, warned = false;
  const stored = S.read();
  const wrap = document.createElement('section'); wrap.className = 'bknotice noprint ffdraft'; wrap.id = 'ffDraftRecovery'; wrap.hidden = true;
  wrap.setAttribute('role', 'region'); wrap.setAttribute('aria-label', 'Unfinished list');
  const heading = document.createElement('p'); const hb = document.createElement('b'); hb.textContent = 'Continue an unfinished list?'; heading.append(hb);
  const desc = document.createElement('p'); desc.className = 'hint';
  const buttons = document.createElement('div'); buttons.className = 'row';
  const restore = document.createElement('button'); restore.type = 'button'; restore.className = 'pri small'; restore.id = 'ffDraftRestore'; restore.textContent = 'Restore my list';
  const discard = document.createElement('button'); discard.type = 'button'; discard.className = 'sec small'; discard.id = 'ffDraftDiscard'; discard.textContent = 'Discard it';
  const msg = document.createElement('p'); msg.className = 'hint'; msg.id = 'ffDraftMsg'; msg.setAttribute('role', 'status'); msg.setAttribute('aria-live', 'polite');
  buttons.append(restore, discard); wrap.append(heading, desc, buttons);
  box.insertAdjacentElement('beforebegin', wrap); wrap.insertAdjacentElement('afterend', msg);
  const message = t => { msg.textContent = t; };
  const show = t => { desc.textContent = t; wrap.hidden = false; };
  const hide = () => { wrap.hidden = true; };
  if (stored.status === 'ok' && C.shouldOfferRecovery(box.value, stored, demo())) {
    blocked = true; show('An unfinished color list is waiting in this browser. Your saved projects and threads were not changed. Backups do not include unfinished lists.');
  } else if (stored.status === 'protected') {
    blocked = true; restore.disabled = true; show('An unfinished list saved here could not be read, maybe by a newer Floss Fox. It was left untouched so nothing is lost, and new typing is not kept until you discard it.');
  } else if (stored.status === 'unavailable') {
    blocked = true; restore.disabled = true; discard.disabled = true; show('This browser is not letting Floss Fox keep unfinished lists. Copy your text somewhere safe before you close this tab.');
  }
  function flush() {
    if (blocked || demo() || box.value === committedText || !box.value.trim()) return;
    const res = S.save(box.value, brand.value);
    if (res.ok) { if (warned) { warned = false; message(''); } return; }
    if (res.reason === 'write-failed' || res.reason === 'unavailable') { warned = true; message('Your unfinished list could not be kept in this browser. Copy it somewhere safe before leaving.'); }
  }
  function queue() { if (blocked || demo()) return; if (box.value !== committedText) committedText = null; clearTimeout(timer); timer = setTimeout(flush, 600); }
  restore.addEventListener('click', async () => {
    const data = S.read(); if (data.status !== 'ok') { message('The unfinished list could not be read. Nothing was changed.'); return; }
    if (box.value.trim() && box.value !== data.item.text) {
      const ok = window.FlossFoxConfirm ? await FlossFoxConfirm.ask({pose: 'thinking', title: 'Replace the text in the box?', body: 'The text in the paste box now is swapped for your unfinished list.', go: 'Replace', keep: 'Keep my text'}) : window.confirm('Replace the text in the paste box with your unfinished list?');
      if (!ok) return;
    }
    box.value = data.item.text;
    if (Array.from(brand.options).some(o => o.value === data.item.brand)) { brand.value = data.item.brand; brand.dispatchEvent(new Event('change', {bubbles: true})); }
    blocked = false; hide(); box.dispatchEvent(new Event('input', {bubbles: true}));
    message('Your list is back. Tap Add my colors to look it over.'); box.focus();
  });
  discard.addEventListener('click', async () => {
    const ok = window.FlossFoxConfirm ? await FlossFoxConfirm.ask({pose: 'worried', title: 'Discard the unfinished list?', body: 'It cannot be brought back. Your saved projects and threads stay put.', go: 'Discard', keep: 'Keep it'}) : window.confirm('Discard the unfinished list? This cannot be undone.');
    if (!ok) return;
    const st = S.clear({force: true}); if (!st.ok) { message('The unfinished list could not be discarded. Browser storage may be blocked.'); return; }
    blocked = false; hide(); message('Unfinished list discarded.');
    if (box.value.trim() && !demo()) flush();
  });
  box.addEventListener('input', queue); brand.addEventListener('change', queue);
  window.addEventListener('pagehide', () => { clearTimeout(timer); flush(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { clearTimeout(timer); flush(); } });
  const clr = document.getElementById('clear');
  if (clr) clr.addEventListener('click', () => { setTimeout(() => { if (!blocked && !demo() && !box.value.trim()) { clearTimeout(timer); S.clear(); } }, 0); });
  // Clear the draft only after a real, successful project save of this exact text (ff:data-saved from projects.js).
  const sp = document.getElementById('saveProj');
  if (sp) sp.addEventListener('click', () => {
    if (blocked || demo()) return;
    const oldSize = P._store().projects.length, text = box.value; let saved = false;
    const listen = e => { if (e.detail && e.detail.area === 'projects') saved = true; };
    window.addEventListener('ff:data-saved', listen);
    setTimeout(() => { // a task later, after the app's own click handler (a microtask can run before it on a real tap)
      window.removeEventListener('ff:data-saved', listen);
      if (saved && P._store().projects.length > oldSize && text === box.value) {
        clearTimeout(timer); committedText = text; const cur = S.read();
        if (cur.status === 'ok' && cur.item.text === text) S.clear();
      }
    }, 0);
  }, {capture: true});
  window.addEventListener('storage', e => {
    if (e.key !== key || blocked || demo()) return;
    const other = S.read();
    if (other.status === 'ok' && box.value.trim() && other.item.text !== box.value) {
      blocked = true; clearTimeout(timer); show('Your unfinished list changed in another tab. Copy the text you are editing first, then choose whether to restore the other one.');
    }
  });
  window.FlossFoxDraftUI = {key, recovery: () => S.read()};
})();
