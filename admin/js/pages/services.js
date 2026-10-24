// SERVICES: each service, and the work samples shown inside it on the "View all my services" dashboard.
import { esc, text, area, pick, file, preview, tools, addBtn, bindForm } from '../ui.js';

const ICON_OPTIONS = [['web', 'Website'], ['ai', 'AI'], ['mobile', 'Mobile app'], ['uiux', 'UI / UX'], ['video', 'Video'], ['automation', 'Automation']];

const blankService = () => ({ id: '', title: 'New service', icon: 'web', blurb: '', samples: [] });
const blankSample = () => ({ title: '', category: '', desc: '', link: '', file: '', poster: '', files: [] });
const blankAttach = () => ({ label: '', src: '' });

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'service';

export function mount(box, shell) {
  const model = { list: structuredClone(shell.content.services || []) };
  let sel = 0;
  const open = new Set();

  const categories = () => [...new Set(model.list.flatMap(s => s.samples.map(x => x.category)).filter(Boolean))];

  const attach = (a, p, k, n) => `
    <div class="row">
      <div class="row__fields">
        ${text({ label: 'Name', path: `${p}.files.${k}.label`, v: a.label, ph: 'e.g. Case study' })}
        ${file({ label: 'File', path: `${p}.files.${k}.src`, v: a.src })}
      </div>
      ${tools(`${p}.files`, k, n, a.label)}
    </div>`;

  const sample = (x, i, j, n) => {
    const p = `list.${i}.samples.${j}`;
    return `
    <details class="card card--fold" data-key="${p}"${open.has(p) ? ' open' : ''}>
      <summary class="card__head">
        <span class="thumb">${preview(x.file)}</span>
        <span class="card__titles"><strong class="card__title">${esc(x.title || 'New sample')}</strong><small>${esc(x.category || 'No category yet')}</small></span>
        ${tools(`list.${i}.samples`, j, n, x.title)}
      </summary>
      <div class="card__body">
        <div class="grid-2">
          ${text({ label: 'Title', path: `${p}.title`, v: x.title })}
          ${text({ label: 'Category', path: `${p}.category`, v: x.category, list: 'cats', ph: 'e.g. E-commerce', hint: 'Visitors filter by this. Pick an existing one to keep it consistent.' })}
        </div>
        ${area({ label: 'Description', path: `${p}.desc`, v: x.desc, rows: 3 })}
        ${file({ label: 'Main image, video or file', path: `${p}.file`, v: x.file, hint: 'A screenshot, video or PDF. A YouTube or Vimeo link also works.' })}
        ${file({ label: 'Cover image (optional)', path: `${p}.poster`, v: x.poster, accept: 'image/*', hint: 'Thumbnail shown for videos and PDFs.' })}
        ${text({ label: 'Live website link (optional)', path: `${p}.link`, v: x.link, type: 'url', ph: 'https://', hint: 'Shows a live preview and an Open button.' })}
        <div class="sub">
          <h3>Download files <small>optional</small></h3>
          ${(x.files || []).map((a, k) => attach(a, p, k, x.files.length)).join('')}
          ${addBtn(`${p}.files`, 'attach', 'Add a download')}
        </div>
      </div>
    </details>`;
  };

  const editor = (s, i) => `
    <div class="card">
      <div class="card__head">
        <strong class="card__title">Service details</strong>
        ${tools('list', i, model.list.length, s.title)}
      </div>
      <div class="card__body">
        <div class="grid-2">
          ${text({ label: 'Service name', path: `list.${i}.title`, v: s.title })}
          ${pick({ label: 'Icon', path: `list.${i}.icon`, v: s.icon, options: ICON_OPTIONS })}
        </div>
        ${area({ label: 'Short description', path: `list.${i}.blurb`, v: s.blurb, rows: 2, hint: 'Shown at the top of this service for visitors.' })}
      </div>
    </div>

    <div class="section-head">
      <h2>Samples <small>${s.samples.length}</small></h2>
      ${addBtn(`list.${i}.samples`, 'sample', 'Add sample')}
    </div>
    ${s.samples.length
      ? `<div class="stack">${s.samples.map((x, j) => sample(x, i, j, s.samples.length)).join('')}</div>`
      : '<div class="empty"><h3>No samples yet</h3><p>Visitors will see "Samples coming soon" for this service until you add one.</p></div>'}`;

  const draw = () => {
    if (sel > model.list.length - 1) sel = Math.max(0, model.list.length - 1);
    const s = model.list[sel];
    box.innerHTML = `
      <datalist id="cats">${categories().map(c => `<option value="${esc(c)}"></option>`).join('')}</datalist>
      <div class="split">
        <nav class="split__rail" aria-label="Services">
          ${model.list.map((x, i) => `<button type="button" class="rail__btn" data-sel="${i}"${i === sel ? ' aria-current="true"' : ''}><span>${esc(x.title || 'Untitled')}</span><em>${x.samples.length}</em></button>`).join('')}
          ${addBtn('list', 'service', 'Add service')}
        </nav>
        <section class="split__body">
          ${s ? editor(s, sel) : '<div class="empty"><h3>No services yet</h3><p>Add your first service on the left.</p></div>'}
        </section>
      </div>`;
  };

  bindForm(box, {
    draft: () => model,
    changed: () => shell.setDirty(true),
    redraw: () => { const y = scrollY; draw(); scrollTo(0, y); },
    templates: { service: blankService, sample: blankSample, attach: blankAttach },
    open,
    after: (act, d) => {
      if (d.path !== 'list') return;
      if (act === 'add') sel = model.list.length - 1;
      else if (act === 'remove') sel = Math.min(sel, model.list.length - 1);
      else if (act === 'up' || act === 'down') sel = Number(d.i) + (act === 'up' ? -1 : 1);
    }
  });

  box.addEventListener('click', e => {
    const b = e.target.closest('[data-sel]');
    if (!b) return;
    sel = Number(b.dataset.sel);
    draw();
    scrollTo(0, 0);
  });

  shell.onSave(async () => {
    const used = new Set();
    const clean = model.list.map((s, i) => {
      const title = s.title.trim();
      if (!title) throw new Error(`Service ${i + 1} needs a name.`);
      let id = s.id || slug(title);
      for (let n = 2; used.has(id); n++) id = `${slug(title)}-${n}`;
      used.add(id);

      const samples = s.samples.map((x, j) => {
        if (!x.title.trim()) throw new Error(`A sample in "${title}" (number ${j + 1}) needs a title.`);
        return {
          title: x.title.trim(),
          category: (x.category || '').trim() || 'General',
          desc: (x.desc || '').trim(),
          link: (x.link || '').trim(),
          file: (x.file || '').trim(),
          poster: (x.poster || '').trim(),
          files: (x.files || []).filter(a => a.src.trim()).map(a => ({ label: a.label.trim() || 'File', src: a.src.trim() }))
        };
      });
      return { id, title, icon: s.icon, blurb: s.blurb.trim(), samples };
    });

    await shell.api.saveSection('services', clean);
    shell.content.services = structuredClone(clean);
    model.list = structuredClone(clean);
    draw();
  });

  draw();
}