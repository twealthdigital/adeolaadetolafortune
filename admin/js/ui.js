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
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'
};
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

export const text = ({ label, path, v, as, type = 'text', ph = '', hint: h = '', list = '' }) => `
  <label class="f"><span class="f__label">${esc(label)}</span>
    <input type="${type}" data-path="${path}"${asAttr(as)} value="${esc(show(v, as))}" placeholder="${esc(ph)}"${list ? ` list="${list}"` : ''} autocomplete="off">
    ${hint(h)}</label>`;

export const area = ({ label, path, v, as, rows = 3, ph = '', hint: h = '' }) => `
  <label class="f"><span class="f__label">${esc(label)}</span>
    <textarea data-path="${path}"${asAttr(as)} rows="${rows}" placeholder="${esc(ph)}">${esc(show(v, as))}</textarea>
    ${hint(h)}</label>`;

export const pick = ({ label, path, v, options, hint: h = '' }) => `
  <label class="f"><span class="f__label">${esc(label)}</span>
    <select data-path="${path}">${options.map(([val, name]) => `<option value="${esc(val)}"${val === v ? ' selected' : ''}>${esc(name)}</option>`).join('')}</select>
    ${hint(h)}</label>`;

// Upload a file OR paste a link. Both end up in the same text box.
export const file = ({ label, path, v, accept = '', hint: h = '' }) => `
  <div class="f" data-file>
    <span class="f__label">${esc(label)}</span>
    <div class="file">
      <div class="file__prev">${preview(v)}</div>
      <div class="file__main">
        <input type="text" data-path="${path}" value="${esc(v ?? '')}" placeholder="Upload a file, or paste a link" autocomplete="off" aria-label="${esc(label)}">
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