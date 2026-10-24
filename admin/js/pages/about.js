// ABOUT: everything in the "Read More About Me" dashboard, split into the same four tabs visitors see.
import { esc, text, area, file, tools, addBtn, bindForm } from '../ui.js';

const DEFAULTS = {
  photo: '/assets/images/fortune-portrait.webp',
  resume: '/assets/resume/myresume.pdf',
  name: 'Adetola Fortune',
  role: 'AI Full Stack Engineer',
  since: 2022,
  projects: 0,
  bio: [], experience: [], certificates: [], documents: [], skills: [], process: [], faq: []
};

const SUBS = [['about', 'About me'], ['certs', 'Certificates'], ['skills', 'Skills'], ['work', 'How I work & FAQ']];

const T = {
  step: () => ({ when: '', title: '', text: '' }),
  doc: () => ({ title: '', file: '' }),
  cert: () => ({ title: '', issuer: '', year: '', file: '', poster: '', files: [] }),
  attach: () => ({ label: '', src: '' }),
  group: () => ({ group: '', items: [] }),
  proc: () => ({ title: '', text: '' }),
  faq: () => ({ q: '', a: '' })
};

export function mount(box, shell) {
  const model = { ...DEFAULTS, ...structuredClone(shell.content.about || {}) };
  let sub = 'about';
  const open = new Set();

  const rowCard = (path, i, n, title, body, what) => `
    <li class="card">
      <div class="card__head"><span class="num">${String(i + 1).padStart(2, '0')}</span><strong class="card__title">${esc(title || 'New item')}</strong>${tools(path, i, n, what)}</div>
      <div class="card__body">${body}</div>
    </li>`;

  const list = (path, items, render, emptyText) => items.length
    ? `<ol class="stack">${items.map((x, i) => render(x, i, items.length)).join('')}</ol>`
    : `<div class="empty"><p>${esc(emptyText)}</p></div>`;

  const VIEWS = {
    about: () => `
      <div class="card">
        <div class="card__head"><strong class="card__title">Profile</strong></div>
        <div class="card__body">
          <div class="pair">
            ${file({ label: 'Your photo', path: 'photo', v: model.photo, accept: 'image/*' })}
            ${file({ label: 'Resume (PDF)', path: 'resume', v: model.resume, accept: '.pdf,application/pdf' })}
          </div>
          <div class="grid-2">
            ${text({ label: 'Name', path: 'name', v: model.name })}
            ${text({ label: 'Role', path: 'role', v: model.role })}
          </div>
          <div class="grid-2">
            ${text({ label: 'Year you started', path: 'since', v: model.since, as: 'number', type: 'number', hint: 'The years of experience are worked out from this, so they update every January.' })}
            ${text({ label: 'Projects built', path: 'projects', v: model.projects, as: 'number', type: 'number' })}
          </div>
          ${area({ label: 'About you', path: 'bio', v: model.bio, as: 'paras', rows: 7, hint: 'Leave a blank line between paragraphs.' })}
        </div>
      </div>

      <div class="section-head"><h2>My experience timeline <small>${model.experience.length}</small></h2>${addBtn('experience', 'step', 'Add step')}</div>
      ${list('experience', model.experience, (x, i, n) => rowCard('experience', i, n, x.title, `
        <div class="grid-2">
          ${text({ label: 'When', path: `experience.${i}.when`, v: x.when, ph: '2024 or Now' })}
          ${text({ label: 'Title', path: `experience.${i}.title`, v: x.title })}
        </div>
        ${area({ label: 'What happened', path: `experience.${i}.text`, v: x.text, rows: 2 })}`, x.title), 'No steps yet.')}

      <div class="section-head"><h2>Documents <small>${model.documents.length}</small></h2>${addBtn('documents', 'doc', 'Add document')}</div>
      ${list('documents', model.documents, (x, i, n) => rowCard('documents', i, n, x.title, `
        ${text({ label: 'Name', path: `documents.${i}.title`, v: x.title, ph: 'e.g. Resume' })}
        ${file({ label: 'File', path: `documents.${i}.file`, v: x.file })}`, x.title), 'Files visitors can download.')}`,

    certs: () => `
      <div class="section-head"><h2>Certificates <small>${model.certificates.length}</small></h2>${addBtn('certificates', 'cert', 'Add certificate')}</div>
      ${model.certificates.length
        ? `<div class="stack">${model.certificates.map((c, i) => {
          const p = `certificates.${i}`;
          return `
          <details class="card card--fold" data-key="${p}"${open.has(p) ? ' open' : ''}>
            <summary class="card__head"><span class="num">${String(i + 1).padStart(2, '0')}</span>
              <span class="card__titles"><strong class="card__title">${esc(c.title || 'New certificate')}</strong><small>${esc([c.issuer, c.year].filter(Boolean).join(' · ') || 'No issuer yet')}</small></span>
              ${tools('certificates', i, model.certificates.length, c.title)}</summary>
            <div class="card__body">
              ${text({ label: 'Certificate title', path: `${p}.title`, v: c.title })}
              <div class="grid-2">
                ${text({ label: 'Issued by', path: `${p}.issuer`, v: c.issuer, ph: 'e.g. Coursera' })}
                ${text({ label: 'Year', path: `${p}.year`, v: c.year, ph: '2025' })}
              </div>
              ${file({ label: 'Certificate image or PDF', path: `${p}.file`, v: c.file })}
              ${file({ label: 'Cover image (optional)', path: `${p}.poster`, v: c.poster, accept: 'image/*', hint: 'Thumbnail when the main file is a PDF.' })}
              <div class="sub"><h3>Download files <small>optional</small></h3>
                ${(c.files || []).map((a, k) => `
                  <div class="row"><div class="row__fields">
                    ${text({ label: 'Name', path: `${p}.files.${k}.label`, v: a.label })}
                    ${file({ label: 'File', path: `${p}.files.${k}.src`, v: a.src })}
                  </div>${tools(`${p}.files`, k, c.files.length, a.label)}</div>`).join('')}
                ${addBtn(`${p}.files`, 'attach', 'Add a download')}
              </div>
            </div>
          </details>`;
        }).join('')}</div>`
        : '<div class="empty"><h3>No certificates yet</h3><p>Visitors see "Certificates coming soon" until you add one.</p></div>'}`,

    skills: () => `
      <div class="section-head"><h2>Skill groups <small>${model.skills.length}</small></h2>${addBtn('skills', 'group', 'Add group')}</div>
      ${list('skills', model.skills, (x, i, n) => rowCard('skills', i, n, x.group, `
        ${text({ label: 'Group name', path: `skills.${i}.group`, v: x.group, ph: 'e.g. Frontend' })}
        ${text({ label: 'Skills', path: `skills.${i}.items`, v: x.items, as: 'csv', ph: 'HTML5, CSS3, React.js', hint: 'Separate with commas.' })}`, x.group), 'No skills yet.')}`,

    work: () => `
      <div class="section-head"><h2>How I work <small>${model.process.length}</small></h2>${addBtn('process', 'proc', 'Add step')}</div>
      ${list('process', model.process, (x, i, n) => rowCard('process', i, n, x.title, `
        ${text({ label: 'Step title', path: `process.${i}.title`, v: x.title, ph: 'e.g. Discover' })}
        ${area({ label: 'Description', path: `process.${i}.text`, v: x.text, rows: 2 })}`, x.title), 'No steps yet.')}

      <div class="section-head"><h2>Questions and answers <small>${model.faq.length}</small></h2>${addBtn('faq', 'faq', 'Add question')}</div>
      ${list('faq', model.faq, (x, i, n) => rowCard('faq', i, n, x.q, `
        ${text({ label: 'Question', path: `faq.${i}.q`, v: x.q })}
        ${area({ label: 'Answer', path: `faq.${i}.a`, v: x.a, rows: 3 })}`, x.q), 'No questions yet.')}`
  };

  const draw = () => {
    box.innerHTML = `
      <div class="tabs" role="tablist">${SUBS.map(([id, label]) => `<button type="button" class="tabs__btn" role="tab" data-sub="${id}"${id === sub ? ' aria-selected="true"' : ''}>${esc(label)}</button>`).join('')}</div>
      ${VIEWS[sub]()}`;
  };

  bindForm(box, {
    draft: () => model,
    changed: () => shell.setDirty(true),
    redraw: () => { const y = scrollY; draw(); scrollTo(0, y); },
    templates: T,
    open
  });

  box.addEventListener('click', e => {
    const b = e.target.closest('[data-sub]');
    if (!b) return;
    sub = b.dataset.sub;
    draw();
    scrollTo(0, 0);
  });

  shell.onSave(async () => {
    const t = s => String(s ?? '').trim();
    const need = (arr, key, label) => {
      const i = arr.findIndex(x => !t(x[key]));
      if (i > -1) throw new Error(`${label} ${i + 1} needs a ${key === 'q' ? 'question' : key === 'group' ? 'group name' : 'title'}.`);
    };
    need(model.experience, 'title', 'Timeline step');
    need(model.certificates, 'title', 'Certificate');
    need(model.documents, 'title', 'Document');
    need(model.skills, 'group', 'Skill group');
    need(model.process, 'title', 'Work step');
    need(model.faq, 'q', 'Question');

    const out = {
      photo: t(model.photo), resume: t(model.resume), name: t(model.name), role: t(model.role),
      since: Number(model.since) || DEFAULTS.since,
      projects: Number(model.projects) || 0,
      bio: model.bio,
      experience: model.experience.map(x => ({ when: t(x.when), title: t(x.title), text: t(x.text) })),
      certificates: model.certificates.map(c => ({
        title: t(c.title), issuer: t(c.issuer), year: t(c.year), file: t(c.file), poster: t(c.poster),
        files: (c.files || []).filter(a => t(a.src)).map(a => ({ label: t(a.label) || 'File', src: t(a.src) }))
      })),
      documents: model.documents.filter(d => t(d.file)).map(d => ({ title: t(d.title), file: t(d.file) })),
      skills: model.skills.map(g => ({ group: t(g.group), items: g.items })),
      process: model.process.map(s => ({ title: t(s.title), text: t(s.text) })),
      faq: model.faq.map(f => ({ q: t(f.q), a: t(f.a) }))
    };
    // Empty profile fields are left out, so the website falls back to its built-in defaults
    for (const k of ['photo', 'resume', 'name', 'role']) if (!out[k]) delete out[k];

    await shell.api.saveSection('about', out);
    shell.content.about = structuredClone(out);
    Object.assign(model, { ...DEFAULTS, ...structuredClone(out) });
    draw();
  });

  draw();
}