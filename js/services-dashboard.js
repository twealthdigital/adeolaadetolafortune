// "View all my services" dashboard: a panel that sits under the header and covers the page.
// Left: the services. Right: samples as boxes, with category filters. Content comes from data/services.js.
import { getContent } from './content.js';
import { mediaInner, attachmentsHTML, videoFacade } from './components/media.js';

const ICONS = {
  all: '<rect x="3" y="3" width="8" height="10" rx="2"/><rect x="13" y="3" width="8" height="6" rx="2"/><rect x="3" y="15" width="8" height="6" rx="2"/><rect x="13" y="11" width="8" height="10" rx="2"/>',
  web: '<path fill-rule="evenodd" d="M5 4h14a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3zM4 9h16V7a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v2z"/>',
  ai: '<path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>',
  mobile: '<path fill-rule="evenodd" d="M8 2h8a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3zm4 16.2a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zM8 5v11h8V5H8z"/>',
  uiux: '<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>',
  video: '<path fill-rule="evenodd" d="M5 4h14a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3zm5 4.5v7l6-3.5-6-3.5z"/>',
  automation: '<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/>',
  close: '<path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>',
  chevron: '<path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>'
};
const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';

const svg = name => `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${ICONS[name] || ICONS.web}</svg>`;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const initials = t => {
  const w = t.replace(/[^\p{L}\p{N}\s]/gu, '').split(/\s+/).filter(Boolean);
  return (w.length > 1 ? w[0][0] + w[1][0] : (w[0] || '').slice(0, 2)).toUpperCase();
};

export function initServicesDashboard() {
  let root, body, tabs, grid, count, filters;
  let opened = false, view = 'all', cat = 'all', opener = null, hideTimer = null;

  const samplesOf = id => (id === 'all' ? SERVICES : SERVICES.filter(s => s.id === id))
    .flatMap(s => s.samples.map(x => ({ ...x, service: s })));
  let SERVICES = [], total = 0;
  const ready = getContent().then(c => {
    SERVICES = (c && c.services) || [];
    total = SERVICES.reduce((n, s) => n + s.samples.length, 0);
  });

  // The old mobile tab bar (fixed at the bottom) must stay visible, so the panel stops above it.
  const bottomOffset = () => {
    const nav = document.querySelector('.nav');
    if (!nav) return 0;
    const cs = getComputedStyle(nav);
    if (cs.position !== 'fixed' || cs.display === 'none') return 0;
    return Math.max(0, Math.round(innerHeight - nav.getBoundingClientRect().top));
  };

  const cardHTML = s => `
    <li class="sd__card">
      <div class="sd__thumb">
        <span class="sd__thumb-ico">${svg(s.service.icon)}</span>
        <span class="sd__thumb-ini" aria-hidden="true">${esc(initials(s.title))}</span>
        ${s.video ? videoFacade(s.video, s.videoThumb, s.title) : s.file ? mediaInner(s.file, s.title, s.poster, false) : ''}
        ${s.image ? `<img src="${esc(s.image)}" alt="Preview of ${esc(s.title)}" loading="lazy" draggable="false">` : ''}
        ${s.link && !s.file && !s.image && !s.video ? `<iframe class="sd__live" src="${esc(s.link)}" title="Live preview of ${esc(s.title)}" loading="lazy" tabindex="-1" scrolling="no" sandbox="allow-scripts allow-same-origin" referrerpolicy="no-referrer"></iframe>` : ''}
      </div>
      <div class="sd__info">
        <div class="sd__chips">
          <span class="sd__chip sd__chip--cat" title="${esc(s.category)}">${esc(s.category)}</span>
          ${view === 'all' ? `<span class="sd__chip">${esc(s.service.title)}</span>` : ''}
        </div>
        <h4 class="sd__name">${esc(s.title)}</h4>
        <p class="sd__desc">${esc(s.desc)}</p>
        ${attachmentsHTML(s.files)}
        ${s.link ? `<a class="sd__open" href="${esc(s.link)}" target="_blank" rel="noopener">Live preview ${ARROW}</a>` : ''}
      </div>
    </li>`;

  const emptyHTML = svc => `
    <li class="sd__empty">
      <span class="sd__empty-icon">${svg(svc ? svc.icon : 'all')}</span>
      <h4>Samples coming soon</h4>
      <p>${svc ? `I'm adding ${esc(svc.title)} work here.` : 'Samples are being added.'} Need this now? Tell me about your project and I'll show you what I can do.</p>
      <a class="btn btn--primary" href="#contact" data-sd-contact>Start a project ${ARROW}</a>
    </li>`;

  // Only the grid, the count and the chip states change when a category is picked,
  // so the chip you tapped keeps keyboard focus.
  const renderGrid = () => {
    const svc = SERVICES.find(s => s.id === view);
    const all = samplesOf(view);
    const shown = cat === 'all' ? all : all.filter(s => s.category === cat);
    grid.innerHTML = shown.length ? shown.map(cardHTML).join('') : emptyHTML(svc);
    count.textContent = all.length ? `Showing ${shown.length} of ${all.length} sample${all.length === 1 ? '' : 's'}` : '';
    filters?.querySelectorAll('[data-cat]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cat === cat)));
  };

  const renderView = () => {
    const svc = SERVICES.find(s => s.id === view);
    const all = samplesOf(view);
    const cats = [...new Set(all.map(s => s.category))];
 

    tabs.forEach(t => {
      if (t.dataset.view === view) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
    });

    body.innerHTML = `
 

      <div class="sd__tools">
        ${cats.length > 1 ? `
          <div class="sd__filters" role="group" aria-label="Filter by category">
            <button class="sd__filter" type="button" data-cat="all" aria-pressed="true">All</button>
            ${cats.map(c => `<button class="sd__filter" type="button" data-cat="${esc(c)}" title="${esc(c)}" aria-pressed="false">${esc(c)}</button>`).join('')}
          </div>` : ''}
        <p class="sd__count" aria-live="polite"></p>
      </div>

      <ul class="sd__grid"></ul>`;

    grid = body.querySelector('.sd__grid');
    count = body.querySelector('.sd__count');
    filters = body.querySelector('.sd__filters');
    renderGrid();
  };

  const select = id => {
    view = id; cat = 'all';
    renderView();
    body.scrollTop = 0;
    root.querySelector(`.sd__tab[data-view="${id}"]`)?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  };

  const build = () => {
    root = document.createElement('div');
    root.className = 'sd';
    root.id = 'services-dashboard';
    root.hidden = true;
    root.tabIndex = -1;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'false');
    root.setAttribute('aria-labelledby', 'sd-title');

    const tab = (id, icon, title, n) => `
      <li>
        <button class="sd__tab" type="button" data-view="${id}" title="${esc(title)}" aria-label="${esc(title)}">
          <span class="sd__tab-icon">${svg(icon)}</span>
          <span class="sd__tab-label">${esc(title)}</span>
          <span class="sd__tab-count">${n}</span>
        </button>
      </li>`;

    root.innerHTML = `
      <div class="sd__bar">
        <div>
          <h2 class="sd__title" id="sd-title">My Services <span>Dashboard</span></h2>
          <p class="sd__sub">${SERVICES.length} services · ${total} sample${total === 1 ? '' : 's'}</p>
        </div>
        <button class="sd__close" type="button" data-sd-close aria-label="Close services dashboard">${svg('close')}</button>
      </div>

      <aside class="sd__side" aria-label="Services">
        <button class="sd__collapse" type="button" data-sd-collapse aria-expanded="true" aria-label="Collapse side panel">${svg('chevron')}</button>
        <p class="sd__eyebrow">Browse</p>
        <ul class="sd__nav">
          ${tab('all', 'all', 'All services', total)}
          ${SERVICES.map(s => tab(s.id, s.icon, s.title, s.samples.length)).join('')}
        </ul>
        <div class="sd__promo">
          <p class="sd__promo-title">Have a project in mind?</p>
          <p class="sd__promo-text">Tell me what you need and I'll get back to you.</p>
          <a class="btn btn--primary sd__promo-btn" href="#contact" data-sd-contact>Start a project ${ARROW}</a>
        </div>
      </aside>

      <div class="sd__body"></div>`;

    document.body.append(root);
    body = root.querySelector('.sd__body');
    tabs = [...root.querySelectorAll('.sd__tab')];

    root.addEventListener('click', e => {
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
      const f = e.target.closest('.sd__filter');
      if (f) { cat = f.dataset.cat; return renderGrid(); }
      if (e.target.closest('[data-sd-contact]')) {
        e.preventDefault();
        close({ focus: false });
        setTimeout(() => document.getElementById('contact')?.scrollIntoView(), 60);
      }
    });
  };

  const open = async (id = 'all', from = null) => {
    await ready;
    if (!root) build();
    clearTimeout(hideTimer);
    if (opened) return select(id);
    opener = from;
    view = SERVICES.some(s => s.id === id) ? id : 'all';
    cat = 'all';
    renderView();
    root.style.setProperty('--sd-bottom', bottomOffset() + 'px');
    root.hidden = false;
    void root.offsetWidth;                        // lets the open animation play
    root.classList.add('is-open');
    document.documentElement.classList.add('is-sd-open');
    document.querySelectorAll('main, footer').forEach(el => { el.inert = true; });   // header stays usable
    opened = true;
    requestAnimationFrame(() => root.focus({ preventScroll: true }));   // keyboard users: Tab goes to the first service
  };

  const close = ({ focus = true } = {}) => {
    if (!opened) return;
    opened = false;
    root.classList.remove('is-open');
    document.documentElement.classList.remove('is-sd-open');
    document.querySelectorAll('main, footer').forEach(el => { el.inert = false; });
    hideTimer = setTimeout(() => { root.hidden = true; }, 350);
    if (focus) opener?.focus({ preventScroll: true });
  };

  // Openers: the "View all my services" button, and each service card's arrow button
  document.addEventListener('click', e => {
    const all = e.target.closest('[data-open-services]');
    if (all) { e.preventDefault(); return open('all', all); }

    const go = e.target.closest('.svc__go');
    if (go) {
      const label = go.closest('.svc')?.querySelector('.svc__label')?.textContent.trim().toLowerCase();
      const svc = SERVICES.find(s => s.title.toLowerCase() === label);
      return open(svc ? svc.id : 'all', go);
    }

    // Header links (and the mobile tab bar / menu button) are still clickable: they close the panel first
    if (opened && e.target.closest('#site-header a[href*="#"], [data-drawer-toggle]')) close({ focus: false });
  });

  addEventListener('keydown', e => { if (e.key === 'Escape' && opened) close(); });
  addEventListener('resize', () => { if (opened) root.style.setProperty('--sd-bottom', bottomOffset() + 'px'); });
}