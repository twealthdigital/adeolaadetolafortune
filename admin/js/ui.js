// Shared building blocks for every admin page: icons, form fields, toasts, confirm box,
// and one small engine (bindForm) that keeps a page's draft data in sync with its inputs.
import { api } from './api.js';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- icons ---------- */
const ICONS = {
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  up: '<path d="m6 15 6-6 6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  external: '<path d="M7 17 17 7M9 7h8v8"/>',
  check: '<path d="m5 12 5 5 9-9"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  panel: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
  chevronL: '<path d="m15 6-6 6 6 6"/>',
  settings: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'
};

// Same service icons as the website
const SVC_ICONS = {
  web: '<path fill-rule="evenodd" d="M5 4h14a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3zM4 9h16V7a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v2z"/>',
  ai: '<path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>',
  mobile: '<path fill-rule="evenodd" d="M8 2h8a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3zm4 16.2a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zM8 5v11h8V5H8z"/>',
  uiux: '<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>',
  video: '<path fill-rule="evenodd" d="M5 4h14a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3zm5 4.5v7l6-3.5-6-3.5z"/>',
  automation: '<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/>'
};
export const svcIcon = name => `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${SVC_ICONS[name] || SVC_ICONS.web}</svg>`;
export const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

/* ---------- paths: "services.0.samples.2.title" ---------- */
export const getPath = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
export function setPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  keys.reduce((o, k) => o[k], obj)[last] = value;
}

// Reads an input's value in the shape the website expects.
export function readValue(el) {
  const v = el.value;
  switch (el.dataset.as) {
    case 'number': return v === '' ? '' : Number(v);
    case 'csv': return v.split(',').map(s => s.trim()).filter(Boolean);
    case 'paras': return v.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
    default: return v;
  }
}
const show = (v, as) => (as === 'csv' ? (v || []).join(', ') : as === 'paras' ? (v || []).join('\n\n') : (v ?? ''));

/* ---------- file previews ---------- */
const EXT = { image: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg'], video: ['mp4', 'webm', 'mov', 'm4v', 'ogv'] };
export const extOf = src => {
  const dm = /^data:[^/;,]+\/([a-z0-9]+)/i.exec(String(src));
  if (dm) return dm[1].toLowerCase();
  const e = (String(src).split(/[?#]/)[0].split('.').pop() || '').toLowerCase();
  return /^[a-z0-9]{1,5}$/.test(e) ? e : '';
};
export const kindOf = src => {
  if (/youtube\.com|youtu\.be|vimeo\.com/i.test(src)) return 'embed';
  const e = extOf(src);
  return EXT.image.includes(e) ? 'image' : EXT.video.includes(e) ? 'video' : 'file';
};
export function preview(src) {
  if (!src) return `<span class="prev prev--empty">${icon('file')}</span>`;
  const k = kindOf(src);
  if (k === 'image') return `<img class="prev" src="${esc(src)}" alt="" loading="lazy">`;
  if (k === 'video') return `<video class="prev" src="${esc(src)}#t=0.1" muted preload="metadata"></video>`;
  if (k === 'embed') return '<span class="prev prev--tag">VIDEO</span>';
  return `<span class="prev prev--tag">${esc(extOf(src).toUpperCase() || 'LINK')}</span>`;
}

/* ---------- form fields (return HTML strings) ---------- */
const hint = h => (h ? `<small class="f__hint">${esc(h)}</small>` : '');
const asAttr = as => (as ? ` data-as="${as}"` : '');

const ico = (name, cls) => icon(name).replace('<svg ', `<svg class="${cls}" `);

export const text = ({ label, path, v, as, type = 'text', ph = '', hint: h = '', options, max = 0 }) => {
  const input = `<input type="${type}" data-path="${path}"${asAttr(as)} value="${esc(show(v, as))}" placeholder="${esc(ph)}"${max ? ` maxlength="${max}"` : ''} autocomplete="off" aria-label="${esc(label)}">`;
  if (!options) return `
  <label class="f"><span class="f__label">${esc(label)}</span>
    ${input}
    ${hint(h)}</label>`;
  return `
  <div class="f"><span class="f__label">${esc(label)}</span>
    <div class="dd dd--combo" data-dd>
      ${input}
      <button type="button" class="ib dd__toggle" tabindex="-1" aria-label="Show suggestions" aria-expanded="false">${icon('down')}</button>
      <div class="dd__menu" role="listbox">
        ${options.map(o => `<button type="button" class="dd__opt" role="option" data-v="${esc(o)}"><span>${esc(o)}</span></button>`).join('')}
        <p class="dd__empty"${options.length ? ' hidden' : ''}>${options.length ? 'No match. Keep typing and it will be saved as a new one.' : 'Nothing saved yet. Tap Add custom, or just type.'}</p>
        <button type="button" class="dd__opt dd__add" role="option" data-add>${icon('plus')}<span>Add custom…</span></button>
      </div>
    </div>
    ${hint(h)}</div>`;
};

export const area = ({ label, path, v, as, rows = 3, ph = '', hint: h = '', max = 0 }) => `
  <label class="f"><span class="f__label">${esc(label)}</span>
    <textarea data-path="${path}"${asAttr(as)} rows="${rows}"${max ? ` maxlength="${max}"` : ''} placeholder="${esc(ph)}">${esc(show(v, as))}</textarea>
    ${hint(h)}</label>`;

export const pick = ({ label, path, v, options, hint: h = '' }) => {
  const cur = options.find(o => o[0] === v) || options[0];
  const badge = o => (o[2] ? `<span class="dd__ico">${svcIcon(o[2])}</span>` : '');
  return `
  <div class="f"><span class="f__label">${esc(label)}</span>
    <div class="dd" data-dd>
      <input type="hidden" data-path="${path}" value="${esc(cur[0])}">
      <button type="button" class="dd__btn" aria-haspopup="listbox" aria-expanded="false" aria-label="${esc(label)}">
        <span class="dd__val">${badge(cur)}<span>${esc(cur[1])}</span></span>${ico('down', 'dd__chev')}
      </button>
      <div class="dd__menu" role="listbox">
        ${options.map(o => `<button type="button" class="dd__opt" role="option" data-v="${esc(o[0])}" aria-selected="${o[0] === cur[0]}">${badge(o)}<span>${esc(o[1])}</span>${ico('check', 'dd__check')}</button>`).join('')}
      </div>
    </div>
    ${hint(h)}</div>`;
};

// Upload a file OR paste a link. Both end up in the same text box.
export const file = ({ label, path, v, accept = '', hint: h = '' }) => `
  <div class="f" data-file>
    <span class="f__label">${esc(label)}</span>
    <div class="file">
      <div class="file__prev">${preview(v)}</div>
      <div class="file__main">
        <input type="hidden" data-path="${path}" value="${esc(v ?? '')}">
        <div class="file__btns">
          <button type="button" class="btn btn--sm" data-act="pick">${icon('upload')} Upload</button>
          <button type="button" class="btn btn--sm btn--ghost" data-act="clear"${v ? '' : ' hidden'}>${icon('x')} Remove</button>
          <span class="file__prog" hidden></span>
        </div>
        <input type="file" hidden${accept ? ` accept="${accept}"` : ''}>
      </div>
    </div>
    ${hint(h)}
  </div>`;

// A YouTube or Vimeo link. Pasting one fetches the thumbnail by itself and shows it straight away.
export const video = ({ label, path, thumbPath, v, thumb, hint: h = '' }) => `
  <div class="f" data-video-field data-thumb-path="${thumbPath}">
    <span class="f__label">${esc(label)}</span>
    <div class="vid">
      <div class="vid__prev">${preview(thumb || '')}</div>
      <div class="vid__main">
        <input type="url" data-path="${path}" data-video-input value="${esc(v ?? '')}" placeholder="Paste a YouTube or Vimeo link" autocomplete="off" aria-label="${esc(label)}">
        <small class="vid__state" aria-live="polite"></small>
      </div>
    </div>
    ${hint(h)}
  </div>`;

const YT_RE = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/;
const VM_RE = /vimeo\.com\/(?:video\/)?(\d+)/;

// Finds the thumbnail picture for a link (YouTube: instant, Vimeo: asks Vimeo)
async function videoThumb(link) {
  const y = link.match(YT_RE);
  if (y) {
    const url = `https://i.ytimg.com/vi/${y[1]}/hqdefault.jpg`;
    await new Promise((ok, no) => { const im = new Image(); im.onload = ok; im.onerror = no; im.src = url; });
    return url;
  }
  const res = await fetch(`https://vimeo.com/api/oembed.json?width=640&url=${encodeURIComponent(link)}`);
  if (!res.ok) throw new Error('no thumbnail');
  const j = await res.json();
  if (!j.thumbnail_url) throw new Error('no thumbnail');
  return j.thumbnail_url;
}

export const tools = (path, i, n, what = '') => `
  <div class="tools">
    <button type="button" class="ib" data-act="up" data-path="${path}" data-i="${i}" aria-label="Move up"${i === 0 ? ' disabled' : ''}>${icon('up')}</button>
    <button type="button" class="ib" data-act="down" data-path="${path}" data-i="${i}" aria-label="Move down"${i === n - 1 ? ' disabled' : ''}>${icon('down')}</button>
    <button type="button" class="ib ib--danger" data-act="remove" data-path="${path}" data-i="${i}" data-what="${esc(what)}" aria-label="Delete">${icon('trash')}</button>
  </div>`;

export const addBtn = (path, tpl, label) =>
  `<button type="button" class="btn btn--add" data-act="add" data-path="${path}" data-tpl="${tpl}">${icon('plus')} ${esc(label)}</button>`;

/* ---------- toast + confirm ---------- */
export function toast(message, type = 'ok') {
  const box = document.getElementById('toasts');
  if (!box) return;
  const t = document.createElement('div');
  t.className = `toast toast--${type}`;
  t.innerHTML = `${icon(type === 'error' ? 'x' : 'check')}<p>${esc(message)}</p>`;
  box.appendChild(t);
  setTimeout(() => t.classList.add('is-out'), type === 'error' ? 5200 : 2800);
  setTimeout(() => t.remove(), type === 'error' ? 5600 : 3200);
}

export function confirmBox(title, message, okLabel = 'Delete') {
  return new Promise(resolve => {
    const m = document.createElement('div');
    m.className = 'modal';
    m.innerHTML = `<div class="modal__box" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <h3>${esc(title)}</h3><p>${esc(message)}</p>
      <div class="modal__btns"><button type="button" class="btn" data-no>Cancel</button><button type="button" class="btn btn--danger" data-yes>${esc(okLabel)}</button></div></div>`;
    const done = v => { m.remove(); document.removeEventListener('keydown', onKey); resolve(v); };
    const onKey = e => { if (e.key === 'Escape') done(false); };
    m.addEventListener('click', e => {
      if (e.target === m || e.target.closest('[data-no]')) done(false);
      else if (e.target.closest('[data-yes]')) done(true);
    });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(m);
    m.querySelector('[data-no]').focus();
  });
}

/* ---------- the form engine ----------
   ctx = {
     draft():   the object the inputs edit (paths like "list.0.name" start from it)
     changed(): called after every edit (turns on "Save changes")
     redraw():  re-renders the page after add / delete / move
     templates: { name: () => newItem }
     open:      Set of <details> keys that should stay open
     after?:    (act, dataset) => void, runs after add/remove, before redraw
   } */
export function bindForm(root, ctx) {
  const closeKeys = path => { for (const k of [...ctx.open]) if (k.startsWith(path + '.')) ctx.open.delete(k); };

  const refreshFile = (wrap, src) => {
    wrap.querySelector('.file__prev').innerHTML = preview(src);
    wrap.querySelector('[data-act="clear"]').hidden = !src;
  };

  // YouTube / Vimeo link: the moment one is pasted, go and get its thumbnail
  const vTimers = new WeakMap();
  const resolveVideo = async (el, wrap) => {
    const link = el.value.trim();
    const prev = wrap.querySelector('.vid__prev');
    const state = wrap.querySelector('.vid__state');
    const tp = wrap.dataset.thumbPath;
    state.classList.remove('is-bad');
    if (!link) {
      prev.innerHTML = preview('');
      state.textContent = '';
      setPath(ctx.draft(), tp, '');
      return ctx.changed();
    }
    if (!YT_RE.test(link) && !VM_RE.test(link)) {
      state.textContent = 'That does not look like a YouTube or Vimeo link.';
      state.classList.add('is-bad');
      return;
    }
    prev.innerHTML = '<span class="prev prev--empty vid__load"></span>';
    state.textContent = 'Getting the thumbnail…';
    try {
      const url = await videoThumb(link);
      if (el.value.trim() !== link) return;   // the link changed while this was loading
      setPath(ctx.draft(), tp, url);
      prev.innerHTML = preview(url);
      state.textContent = 'Thumbnail added.';
    } catch {
      if (el.value.trim() !== link) return;
      setPath(ctx.draft(), tp, '');
      prev.innerHTML = preview('');
      state.textContent = 'Link saved, but its thumbnail could not be loaded.';
      state.classList.add('is-bad');
    }
    ctx.changed();
  };
  root.addEventListener('input', e => {
    const el = e.target;
    if (!el.matches || !el.matches('[data-video-input]')) return;
    clearTimeout(vTimers.get(el));
    vTimers.set(el, setTimeout(() => resolveVideo(el, el.closest('[data-video-field]')), e.inputType === 'insertFromPaste' ? 0 : 500));
  });

  const onEdit = e => {
    const el = e.target;
    if (!el.dataset || !el.dataset.path || el.type === 'file') return;
    setPath(ctx.draft(), el.dataset.path, readValue(el));
    const wrap = el.closest('[data-file]');
    if (wrap && e.type === 'change') refreshFile(wrap, el.value);
    ctx.changed();
  };
  root.addEventListener('input', onEdit);
  root.addEventListener('change', onEdit);

  // Uploading a file
  root.addEventListener('change', async e => {
    const picker = e.target;
    if (picker.type !== 'file' || !picker.files || !picker.files[0]) return;
    const wrap = picker.closest('[data-file]');
    const input = wrap.querySelector('[data-path]');
    const path = input.dataset.path;
    const btn = wrap.querySelector('[data-act="pick"]');
    const prog = wrap.querySelector('.file__prog');
    btn.disabled = true;
    prog.hidden = false;
    prog.textContent = '0%';
    try {
      const res = await api.upload(picker.files[0], p => { prog.textContent = p + '%'; });
      input.value = res.url;
      setPath(ctx.draft(), path, res.url);
      refreshFile(wrap, res.url);
      ctx.changed();
      toast('File uploaded');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false;
      prog.hidden = true;
      picker.value = '';
    }
  });

  // Buttons: add / remove / move / upload / clear
  root.addEventListener('click', async e => {
    const b = e.target.closest('[data-act]');
    if (!b || !root.contains(b)) return;
    e.preventDefault();
    const act = b.dataset.act;

    if (act === 'pick') return b.closest('[data-file]').querySelector('input[type="file"]').click();
    if (act === 'clear') {
      const wrap = b.closest('[data-file]');
      const input = wrap.querySelector('[data-path]');
      input.value = '';
      setPath(ctx.draft(), input.dataset.path, '');
      refreshFile(wrap, '');
      return ctx.changed();
    }

    const path = b.dataset.path;
    const list = getPath(ctx.draft(), path);
    const i = Number(b.dataset.i);

    if (act === 'add') {
      list.push(ctx.templates[b.dataset.tpl]());
      ctx.open.add(`${path}.${list.length - 1}`);
    } else if (act === 'remove') {
      const ok = await confirmBox('Delete this?', b.dataset.what ? `"${b.dataset.what}" will be removed. Nothing is final until you press Save changes.` : 'This will be removed. Nothing is final until you press Save changes.');
      if (!ok) return;
      list.splice(i, 1);
      closeKeys(path);
    } else if (act === 'up' && i > 0) {
      [list[i - 1], list[i]] = [list[i], list[i - 1]];
      closeKeys(path);
    } else if (act === 'down' && i < list.length - 1) {
      [list[i + 1], list[i]] = [list[i], list[i + 1]];
      closeKeys(path);
    } else return;

    if (ctx.after) ctx.after(act, b.dataset);
    ctx.changed();
    ctx.redraw();
  });

  // Remember which sample cards are open (the "toggle" event does not bubble, so listen while capturing)
  root.addEventListener('toggle', e => {
    const key = e.target.dataset && e.target.dataset.key;
    if (!key) return;
    if (e.target.open) ctx.open.add(key); else ctx.open.delete(key);
  }, true);
}


/* ---------- custom dropdowns (replace <select> and <datalist>) ---------- */
const closeDd = d => {
  d.classList.remove('is-open', 'is-up');
  d.querySelector('.dd__btn, .dd__toggle')?.setAttribute('aria-expanded', 'false');
};
const closeAllDd = except => document.querySelectorAll('[data-dd].is-open').forEach(d => { if (d !== except) closeDd(d); });

function filterDd(d, q) {
  q = q.trim().toLowerCase();
  let shown = 0;
  const add = d.querySelector('.dd__add');
  if (add) add.hidden = !!q;
  d.querySelectorAll('.dd__opt:not(.dd__add)').forEach(o => {
    const hit = !q || o.textContent.toLowerCase().includes(q);
    o.hidden = !hit;
    if (hit) shown++;
  });
  const empty = d.querySelector('.dd__empty');
  if (empty) empty.hidden = shown > 0;
}

function openDd(d, filter = '') {
  closeAllDd(d);
  if (d.classList.contains('dd--combo')) filterDd(d, filter);
  d.classList.remove('is-up');
  const menu = d.querySelector('.dd__menu');
  const room = innerHeight - d.getBoundingClientRect().bottom - (innerWidth < 800 ? 88 : 16);
  const need = Math.min(menu.scrollHeight, 260) + 12;
  if (room < need && d.getBoundingClientRect().top > need) d.classList.add('is-up');
  d.classList.add('is-open');
  d.querySelector('.dd__btn, .dd__toggle')?.setAttribute('aria-expanded', 'true');
}

function chooseDd(d, opt) {
  const input = d.querySelector('input');
  input.value = opt.dataset.v;
  if (!d.classList.contains('dd--combo')) {
    d.querySelectorAll('.dd__opt').forEach(o => o.setAttribute('aria-selected', String(o === opt)));
    d.querySelector('.dd__val').innerHTML = opt.querySelector('.dd__ico')?.outerHTML + `<span>${opt.querySelector('span:not(.dd__ico)').innerHTML}</span>`;
  }
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  closeDd(d);
  if (!d.classList.contains('dd--combo')) d.querySelector('.dd__btn').focus();
}

document.addEventListener('click', e => {
  const d = e.target.closest('[data-dd]');
  if (!d) return closeAllDd();
  const opt = e.target.closest('.dd__opt');
  if (opt && opt.matches('.dd__add')) {
    const input = d.querySelector('input');
    input.value = '';
    input.placeholder = 'Type your new one, then save';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
    return closeDd(d);
  }
  if (opt) return chooseDd(d, opt);
  if (e.target.closest('.dd__btn, .dd__toggle')) {
    if (d.classList.contains('is-open')) closeDd(d); else openDd(d);
  }
});
document.addEventListener('input', e => {
  if (!e.isTrusted) return;
  const d = e.target.closest?.('.dd--combo');
  if (!d || !e.target.matches('input')) return;
  if (d.classList.contains('is-open')) filterDd(d, e.target.value); else openDd(d, e.target.value);
});
document.addEventListener('focusin', e => {
  const d = e.target.closest?.('.dd--combo');
  if (d && e.target.matches('input') && !d.classList.contains('is-open')) openDd(d);
});
document.addEventListener('focusout', e => {
  const d = e.target.closest?.('[data-dd]');
  if (d && !d.contains(e.relatedTarget)) closeDd(d);
});
document.addEventListener('keydown', e => {
  const d = e.target.closest?.('[data-dd]');
  if (!d) return;
  const isOpen = d.classList.contains('is-open');
  if (e.key === 'Escape' && isOpen) {
    e.stopPropagation();
    closeDd(d);
    (d.querySelector('.dd__btn') || d.querySelector('input')).focus();
  } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    if (!isOpen) openDd(d, d.classList.contains('dd--combo') ? d.querySelector('input').value : '');
    const list = [...d.querySelectorAll('.dd__opt:not([hidden])')];
    if (!list.length) return;
    const down = e.key === 'ArrowDown';
    const i = list.indexOf(document.activeElement);
    list[i < 0 ? (down ? 0 : list.length - 1) : (i + (down ? 1 : -1) + list.length) % list.length].focus();
  }
});

/* ---------- text areas grow with their text, so they never show a scrollbar ---------- */
const fit = t => { t.style.height = 'auto'; t.style.height = t.scrollHeight + 2 + 'px'; };
const fitAll = () => document.querySelectorAll('textarea').forEach(fit);
let fitQueued = false;
const queueFit = () => { if (fitQueued) return; fitQueued = true; requestAnimationFrame(() => { fitQueued = false; fitAll(); }); };
document.addEventListener('input', e => { if (e.target.matches?.('textarea')) fit(e.target); });
document.addEventListener('toggle', e => e.target.querySelectorAll?.('textarea').forEach(fit), true);
addEventListener('resize', queueFit);
new MutationObserver(queueFit).observe(document.getElementById('app'), { childList: true, subtree: true });