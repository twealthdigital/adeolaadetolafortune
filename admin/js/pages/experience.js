// EXPERIENCE: the cards in the homepage "My Experience" timeline.
import { esc, text, area, tools, addBtn, bindForm } from '../ui.js';

const blank = () => ({ name: '', desc: '', skills: [] });

export function mount(box, shell) {
  const model = { list: structuredClone(shell.content.experience || []) };
  let fresh = false;

  const card = (x, i) => `
    <li class="card">
      <div class="card__head">
        <span class="num">${String(i + 1).padStart(2, '0')}</span>
        <strong class="card__title">${esc(x.name || 'New experience')}</strong>
        ${tools('list', i, model.list.length, x.name)}
      </div>
      <div class="card__body">
        ${text({ label: 'Name', path: `list.${i}.name`, v: x.name, ph: 'e.g. ACCOOM' })}
        ${area({ label: 'What you did', path: `list.${i}.desc`, v: x.desc, rows: 3 })}
        ${text({ label: 'Skills used (optional)', path: `list.${i}.skills`, v: x.skills, as: 'csv', ph: 'React, Node.js, MongoDB', hint: 'Separate with commas.' })}
      </div>
    </li>`;

  const draw = () => {
    box.innerHTML = `
      <p class="intro">Each card below appears in <b>My Experience</b> on your homepage, in this order. Use the arrows to reorder.</p>
      <div class="section-head section-head--top">
        <h2>Timeline <small>${model.list.length}</small></h2>
        ${addBtn('list', 'item', 'Add experience')}
      </div>
      ${model.list.length ? `<ol class="stack">${model.list.map(card).join('')}</ol>` : '<div class="empty"><h3>No experience yet</h3><p>Press “Add experience” above to add your first one.</p></div>'}`;
  };

  bindForm(box, {
    draft: () => model,
    changed: () => shell.setDirty(true),
    redraw: () => {
      const y = scrollY;
      draw();
      if (fresh) {                                   // new card added at the end: bring it into view
        fresh = false;
        const c = box.querySelector('.stack > li:last-child');
        c?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        c?.querySelector('input')?.focus({ preventScroll: true });
      } else scrollTo(0, y);
    },
    templates: { item: blank },
    open: new Set(),
    after: act => { if (act === 'add') fresh = true; }
  });

  shell.onSave(async () => {
    const clean = model.list.map(x => ({ name: x.name.trim(), desc: x.desc.trim(), skills: x.skills }));
    const bad = clean.findIndex(x => !x.name);
    if (bad > -1) throw new Error(`Experience ${String(bad + 1).padStart(2, '0')} needs a name.`);
    await shell.api.saveSection('experience', clean);
    shell.content.experience = structuredClone(clean);
    model.list = structuredClone(clean);
    draw();
  });

  draw();
}