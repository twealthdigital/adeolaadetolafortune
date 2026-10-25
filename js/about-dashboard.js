// ABOUT DASHBOARD: opens from "Read More About Me". Same look as the services dashboard.
// Edit your content in CONFIG below. Nothing else needs touching.
//
// CERTIFICATES: put each image in /assets/certificates/ and add one { ... } line per certificate.

import { mediaInner, attachmentsHTML, kindOf } from './components/media.js';
import { getContent } from './content.js';

// Filled from content/content.json (edited in the admin). Only safe defaults live here.
let CONFIG = {
  photo: '/assets/images/fortune-portrait.webp',
  resume: '/assets/resume/myresume.pdf',
  name: 'Adetola Fortune',
  role: 'AI Full Stack Engineer',
  since: 2022,
  projects: 0,
  bio: [], experience: [], certificates: [], documents: [], skills: [], process: [], faq: []
};

const ICONS = {
  user: '<path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.4 0-8 2.2-8 5v3h16v-3c0-2.8-3.6-5-8-5z"/>',
  cert: '<path fill-rule="evenodd" d="M12 2a6.5 6.5 0 0 0-3.9 11.7L7 22l5-3 5 3-1.1-8.3A6.5 6.5 0 0 0 12 2zm0 2.5a4 4 0 1 1 0 8 4 4 0 0 1 0-8z"/>',
  code: '<path d="M8.6 16.6 4 12l4.6-4.6L10 8.8 6.8 12l3.2 3.2-1.4 1.4zm6.8 0-1.4-1.4 3.2-3.2L14 8.8l1.4-1.4L20 12l-4.6 4.6z"/>',
  help: '<path fill-rule="evenodd" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1 15v-2h2v2h-2zm3.1-6.1c-.5.6-1.2.9-1.6 1.4-.3.3-.5.6-.5 1.2h-2c0-1 .3-1.6.9-2.2.6-.6 1.3-.9 1.3-1.6 0-.5-.4-.9-1.1-.9s-1.2.4-1.3 1.1H8.8c.1-1.7 1.4-2.8 3.2-2.8s3.3 1 3.3 2.6c0 .5-.2.9-.2 1.2z"/>',
  chevron: '<path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>',
  close: '<path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>'
};
const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';
const DOWNLOAD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>';

const svg = n => `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${ICONS[n]}</svg>`;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const TABS = [
  ['about', 'user', 'About me'],
  ['certificates', 'cert', 'Certificates'],
  ['skills', 'code', 'Skills'],
  ['faq', 'help', 'How I work & FAQ']
];

const VIEWS = {
  about: () => {
    const years = Math.max(1, new Date().getFullYear() - CONFIG.since);
    return `
      <section class="ab__hero">
        <img class="ab__photo" src="${esc(CONFIG.photo)}" alt="Portrait of ${esc(CONFIG.name)}" draggable="false">
        <div>
          <h3 class="ab__name">${esc(CONFIG.name)}</h3>
          <p class="ab__role">${esc(CONFIG.role)}</p>
          ${CONFIG.bio.map(p => `<p class="ab__text">${esc(p)}</p>`).join('')}
          <div class="ab__actions">
            <a class="btn btn--primary" href="${esc(CONFIG.resume)}" download="Adetola-Fortune-Resume.pdf">Download resume ${DOWNLOAD}</a>
            <a class="btn btn--dark" href="#contact" data-sd-contact>Let's work together</a>
          </div>
        </div>
      </section>

      <div class="sd__stats">
        <div class="sd__stat"><b>${years}+</b><span>Years experience</span></div>
        <div class="sd__stat"><b>${CONFIG.projects}</b><span>Projects built</span></div>
        <div class="sd__stat"><b>${CONFIG.certificates.length}</b><span>Certificates</span></div>
      </div>

      <section>
        <h4 class="ab__h">My experience</h4>
        <ol class="ab__timeline">
          ${CONFIG.experience.map(x => `
            <li class="ab__step">
              <span class="ab__when">${esc(x.when)}</span>
              <h4>${esc(x.title)}</h4>
              <p>${esc(x.text)}</p>
            </li>`).join('')}
        </ol>
      </section>

      ${CONFIG.documents && CONFIG.documents.length ? `
      <section>
        <h4 class="ab__h">Documents</h4>
        <div style="margin-top:14px">${attachmentsHTML(CONFIG.documents.map(d => ({ label: d.title, src: d.file })))}</div>
      </section>` : ''}`;
  },

  certificates: () => CONFIG.certificates.length
    ? `<h4 class="ab__h">Certificates</h4>
       <ul class="sd__grid">${CONFIG.certificates.map(c => `
         <li class="sd__card">
           <div class="sd__thumb ab__cert">
             <span class="sd__thumb-ico">${svg('cert')}</span>
             ${mediaInner(c.file || c.video || c.image, c.title, c.poster, false)}
             ${certImage(c) ? `<button class="ab__zoom" type="button" data-cert-view="${esc(certImage(c))}" data-cert-title="${esc(c.title)}" aria-label="View ${esc(c.title)} in full"></button>` : ''}
           </div>
           <div class="sd__info">
             <div class="sd__chips"><span class="sd__chip sd__chip--cat">${esc(c.year)}</span></div>
             <h4 class="sd__name">${esc(c.title)}</h4>
             <p class="sd__desc">${esc(c.issuer)}</p>
             ${attachmentsHTML(c.files)}
           </div>
         </li>`).join('')}</ul>`
    : `<ul class="sd__grid"><li class="sd__empty"><span class="sd__empty-icon">${svg('cert')}</span><h4>Certificates coming soon</h4><p>I'm adding my certificates here.</p></li></ul>`,

  skills: () => CONFIG.skills.map(g => `
    <section>
      <h4 class="ab__h">${esc(g.group)}</h4>
      <ul class="ab__chips">${g.items.map(i => `<li class="ab__skill">${esc(i)}</li>`).join('')}</ul>
    </section>`).join(''),

  faq: () => `
    <section>
      <h4 class="ab__h">How I work</h4>
      <ol class="ab__process">
        ${CONFIG.process.map((s, i) => `
          <li class="ab__proc"><span class="ab__when">Step ${i + 1}</span><h4>${esc(s.title)}</h4><p>${esc(s.text)}</p></li>`).join('')}
      </ol>
    </section>
    <section>
      <h4 class="ab__h">Frequently asked questions</h4>
      <div class="ab__faq">
        ${CONFIG.faq.map(f => `<details class="ab__q"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}
      </div>
    </section>`
};

// ---- Certificate viewer: opens a certificate in a box, with a watermark burned into the picture ----
const WATERMARK = 'Adeola Fortune Adetola  ·  For viewing only  ·  Not for reuse';

// The picture to show for a certificate (an image, or the cover of a PDF). Videos are left alone.
const certImage = c => {
  const src = c.file || c.image || '';
  const k = kindOf(src);
  return k === 'image' ? src : (k === 'file' && c.poster ? c.poster : '');
};

function paintCertificate(img, canvas) {
  const w = Math.min(img.naturalWidth, 1600);
  const h = Math.round(img.naturalHeight * (w / img.naturalWidth));
  const fs = Math.max(14, Math.round(w / 40));
  const bar = Math.round(fs * 2.4);
  canvas.width = w;
  canvas.height = h + bar;
  const g = canvas.getContext('2d');
  g.drawImage(img, 0, 0, w, h);

  // faint diagonal name across the whole certificate, so cropping the bottom label is not enough
  g.save();
  g.beginPath(); g.rect(0, 0, w, h); g.clip();
  g.translate(w / 2, h / 2);
  g.rotate(-Math.PI / 7);
  g.font = `800 ${fs}px Sora, system-ui, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineWidth = Math.max(1, fs / 10);
  g.strokeStyle = 'rgba(0,0,0,.22)';
  g.fillStyle = 'rgba(255,255,255,.28)';
  const span = Math.hypot(w, h), stepY = fs * 4.4, stepX = fs * 19;
  let row = 0;
  for (let y = -span; y < span; y += stepY, row++) {
    for (let x = -span + (row % 2) * (stepX / 2); x < span; x += stepX) {
      g.strokeText('ADEOLA FORTUNE ADETOLA', x, y);
      g.fillText('ADEOLA FORTUNE ADETOLA', x, y);
    }
  }
  g.restore();

  // label strip under the certificate
  g.fillStyle = '#000';
  g.fillRect(0, h, w, bar);
  g.fillStyle = '#ffd20a';
  g.font = `800 ${Math.round(bar * 0.42)}px Sora, system-ui, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(WATERMARK, w / 2, h + bar / 2, w * 0.94);
}

function openCertificate(src, title, from) {
  const box = document.createElement('div');
  box.className = 'cert';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', title || 'Certificate');
  box.innerHTML = `
    <button class="cert__x" type="button" data-cert-x aria-label="Close">&times;</button>
    <figure class="cert__fig">
      <div class="cert__stage"><span class="cert__wait">Loading…</span></div>
      <figcaption class="cert__cap"></figcaption>
    </figure>`;
  box.querySelector('.cert__cap').textContent = title || '';
  document.body.append(box);
  document.documentElement.style.overflow = 'hidden';

  const finish = () => {
    removeEventListener('keydown', onKey, true);
    document.documentElement.style.overflow = '';
    box.remove();
    from?.focus({ preventScroll: true });
  };
  // Escape closes only this box, not the dashboard behind it
  const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); finish(); } };
  addEventListener('keydown', onKey, true);
  box.addEventListener('click', e => { if (e.target === box || e.target.closest('[data-cert-x]')) finish(); });
  box.addEventListener('contextmenu', e => e.preventDefault());
  box.querySelector('[data-cert-x]').focus({ preventScroll: true });

  const stage = box.querySelector('.cert__stage');
  const img = new Image();
  img.onload = async () => {
    try { await document.fonts?.load('800 20px Sora'); } catch { /* fine, a fallback font is used */ }
    const canvas = document.createElement('canvas');
    canvas.className = 'cert__canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', title || 'Certificate');
    paintCertificate(img, canvas);
    stage.replaceChildren(canvas);
  };
  img.onerror = () => { stage.innerHTML = '<span class="cert__wait">Could not load this certificate.</span>'; };
  img.src = src;
}

export function initAboutDashboard() {
  let root, body, tabs;
  let opened = false, view = 'about', opener = null, hideTimer = null;
  const ready = getContent().then(c => { if (c && c.about) CONFIG = { ...CONFIG, ...c.about }; });

  // The mobile tab bar stays visible, so the panel stops above it.
  const bottomOffset = () => {
    const nav = document.querySelector('.nav');
    if (!nav) return 0;
    const cs = getComputedStyle(nav);
    if (cs.position !== 'fixed' || cs.display === 'none') return 0;
    return Math.max(0, Math.round(innerHeight - nav.getBoundingClientRect().top));
  };

  const render = () => {
    tabs.forEach(t => {
      if (t.dataset.view === view) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
    });
    body.innerHTML = VIEWS[view]();
  };

  const select = id => {
    view = id;
    render();
    body.scrollTop = 0;
    root.querySelector(`.sd__tab[data-view="${id}"]`)?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  };

  const build = () => {
    root = document.createElement('div');
    root.className = 'sd sd--about';
    root.id = 'about-dashboard';
    root.hidden = true;
    root.tabIndex = -1;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'false');
    root.setAttribute('aria-labelledby', 'ab-title');

    const tab = ([id, icon, title]) => `
      <li>
        <button class="sd__tab" type="button" data-view="${id}" title="${esc(title)}" aria-label="${esc(title)}">
          <span class="sd__tab-icon">${svg(icon)}</span>
          <span class="sd__tab-label">${esc(title)}</span>
        </button>
      </li>`;

    root.innerHTML = `
      <div class="sd__bar">
        <div>
          <h2 class="sd__title" id="ab-title">About <span>Me</span></h2>
          <p class="sd__sub">Who I am, what I've done and how I work</p>
        </div>
        <button class="sd__close" type="button" data-sd-close aria-label="Close about dashboard">${svg('close')}</button>
      </div>

      <aside class="sd__side" aria-label="About sections">
        <button class="sd__collapse" type="button" data-sd-collapse aria-expanded="true" aria-label="Collapse side panel">${svg('chevron')}</button>
        <p class="sd__eyebrow">Browse</p>
        <ul class="sd__nav">${TABS.map(tab).join('')}</ul>
        <div class="sd__promo">
          <p class="sd__promo-title">Want the full details?</p>
          <p class="sd__promo-text">Grab my resume, or tell me about your project.</p>
          <a class="btn btn--primary sd__promo-btn" href="${esc(CONFIG.resume)}" download="Adetola-Fortune-Resume.pdf">Download resume ${DOWNLOAD}</a>
        </div>
      </aside>

      <div class="sd__body"></div>`;

    document.body.append(root);
    body = root.querySelector('.sd__body');
    tabs = [...root.querySelectorAll('.sd__tab')];

    // A certificate image that is missing just leaves the tile empty
    root.addEventListener('error', e => { if (e.target.tagName === 'IMG') e.target.remove(); }, true);

    root.addEventListener('click', e => {
      const zoom = e.target.closest('[data-cert-view]');
      if (zoom) return openCertificate(zoom.dataset.certView, zoom.dataset.certTitle, zoom);
      if (e.target.closest('[data-sd-close]')) return close();
      const col = e.target.closest('[data-sd-collapse]');
      if (col) {
        const c = root.classList.toggle('is-collapsed');
        col.setAttribute('aria-expanded', String(!c));
        col.setAttribute('aria-label', c ? 'Expand side panel' : 'Collapse side panel');
        return;
      }
      const t = e.target.closest('.sd__tab');
      if (t) return select(t.dataset.view);
      if (e.target.closest('[data-sd-contact]')) {
        e.preventDefault();
        close({ focus: false });
        setTimeout(() => document.getElementById('contact')?.scrollIntoView(), 60);
      }
    });
  };

  const open = async (id = 'about', from = null) => {
    await ready;
    if (!root) build();
    clearTimeout(hideTimer);
    if (opened) return select(id);
    opener = from;
    view = VIEWS[id] ? id : 'about';
    render();
    root.style.setProperty('--sd-bottom', bottomOffset() + 'px');
    root.hidden = false;
    void root.offsetWidth;
    root.classList.add('is-open');
    document.documentElement.classList.add('is-sd-open');
    document.querySelectorAll('main, footer').forEach(el => { el.inert = true; });
    opened = true;
    requestAnimationFrame(() => root.focus({ preventScroll: true }));
  };

  const close = ({ focus = true } = {}) => {
    if (!opened) return;
    opened = false;
    root.querySelectorAll('video, audio').forEach(v => v.pause());
    root.classList.remove('is-open');
    document.documentElement.classList.remove('is-sd-open');
    document.querySelectorAll('main, footer').forEach(el => { el.inert = false; });
    hideTimer = setTimeout(() => { root.hidden = true; }, 350);
    if (focus) opener?.focus({ preventScroll: true });
  };

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-open-about]');
    if (btn) { e.preventDefault(); return open('about', btn); }
    // Header links and the mobile tab bar close the panel first
    if (opened && e.target.closest('#site-header a[href*="#"], [data-drawer-toggle]')) close({ focus: false });
  });

  addEventListener('keydown', e => { if (e.key === 'Escape' && opened) close(); });
  addEventListener('resize', () => { if (opened) root.style.setProperty('--sd-bottom', bottomOffset() + 'px'); });
}