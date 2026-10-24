// Admin shell: login gate, side/bottom navigation, and the Save bar shared by every page.
import { api, setUnauthorizedHandler } from './api.js';
import { icon, toast, confirmBox, esc } from './ui.js';
import { renderLogin } from './pages/login.js';

const PAGES = [
  { id: 'experience', label: 'Experience', hint: 'The timeline on your homepage.', icon: 'briefcase', load: () => import('./pages/experience.js') },
  { id: 'services', label: 'Services', hint: 'Your services and the work samples inside each one.', icon: 'grid', load: () => import('./pages/services.js') },
  { id: 'about', label: 'About', hint: 'Your profile, certificates, skills and FAQ.', icon: 'user', load: () => import('./pages/about.js') },
  { id: 'contact', label: 'Contact form', hint: 'Connect the form so messages reach your inbox.', icon: 'mail', load: () => import('./pages/settings.js') }
];

const app = document.getElementById('app');
const state = { content: null, page: '', dirty: false, save: null };

const $ = sel => app.querySelector(sel);

function setDirty(v) {
  state.dirty = v;
  const btn = $('#save-btn');
  const label = $('#save-state');
  if (!btn || !label) return;
  btn.disabled = !v;
  label.textContent = v ? 'Unsaved changes' : 'All changes saved';
  label.classList.toggle('is-dirty', v);
}

async function openPage(id, { force = false } = {}) {
  const def = PAGES.find(p => p.id === id) || PAGES[0];
  if (!force && state.dirty && def.id !== state.page) {
    const ok = await confirmBox('Leave without saving?', 'You have changes that are not saved yet. They will be lost.', 'Leave anyway');
    if (!ok) return;
  }

  state.page = def.id;
  state.save = null;
  history.replaceState(null, '', '#' + def.id);

  app.querySelectorAll('.nav__btn').forEach(b => {
    if (b.dataset.page === def.id) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  $('#page-title').textContent = def.label;
  $('#page-hint').textContent = def.hint;

  const host = $('#page');
  const box = document.createElement('div');   // a fresh box each time, so old listeners disappear with it
  box.className = 'page__inner';
  host.replaceChildren(box);
  setDirty(false);
  window.scrollTo(0, 0);

  const mod = await def.load();
  await mod.mount(box, {
    api,
    toast,
    content: state.content,
    setDirty,
    onSave: fn => { state.save = fn; },
    logout
  });
}

async function save() {
  if (!state.save) return;
  const btn = $('#save-btn');
  btn.disabled = true;
  btn.textContent = 'Saving...';
  try {
    await state.save();
    setDirty(false);
    toast('Saved. Your website is updated.');
  } catch (err) {
    setDirty(true);
    toast(err.message, 'error');
  } finally {
    btn.textContent = 'Save changes';
  }
}

async function logout() {
  if (state.dirty) {
    const ok = await confirmBox('Log out without saving?', 'You have changes that are not saved yet.', 'Log out');
    if (!ok) return;
  }
  try { await api.logout(); } catch { /* already logged out */ }
  state.dirty = false;
  showLogin();
}

function showLogin(message = '') {
  state.dirty = false;
  renderLogin(app, { message, onSuccess: showDashboard });
}

async function showDashboard() {
  app.innerHTML = '<p class="boot">Loading your content...</p>';
  try {
    state.content = await api.getContent();
  } catch (err) {
    if (err.status === 401) return showLogin();
    return showProblem(err.message);
  }

  app.innerHTML = `
    <div class="shell">
      <aside class="side">
        <a class="side__brand" href="/admin/"><img src="/assets/images/logo-if.webp" alt="" width="36" height="36"><span>Admin</span></a>
        <nav class="side__nav" aria-label="Admin sections">
          ${PAGES.map(p => `<button type="button" class="nav__btn" data-page="${p.id}">${icon(p.icon)}<span>${esc(p.label)}</span></button>`).join('')}
        </nav>
        <div class="side__foot">
          <a class="side__link" href="/" target="_blank" rel="noopener">${icon('external')} View website</a>
          <button type="button" class="side__link" id="logout">${icon('logout')} Log out</button>
        </div>
      </aside>

      <main class="main">
        <header class="bar">
          <div class="bar__title"><h1 id="page-title"></h1><p id="page-hint"></p></div>
          <div class="bar__actions">
            <span class="bar__state" id="save-state">All changes saved</span>
            <button type="button" class="btn btn--primary" id="save-btn" disabled>Save changes</button>
            <button type="button" class="ib bar__out" id="logout-m" aria-label="Log out">${icon('logout')}</button>
          </div>
        </header>
        <div class="page" id="page"></div>
      </main>
    </div>`;

  app.querySelector('.side__nav').addEventListener('click', e => {
    const b = e.target.closest('[data-page]');
    if (b) openPage(b.dataset.page);
  });
  $('#save-btn').addEventListener('click', save);
  $('#logout').addEventListener('click', logout);
  $('#logout-m').addEventListener('click', logout);

  openPage(location.hash.slice(1), { force: true });
}

function showProblem(message) {
  app.innerHTML = `<main class="login"><div class="login__card"><h1>Can't reach the backend</h1><p>${esc(message)}</p>
    <p>Start it with <code>npm run dev</code> in the portfolio-backend folder, then try again.</p>
    <button type="button" class="btn btn--primary btn--block" id="retry">Try again</button></div></main>`;
  $('#retry').addEventListener('click', boot);
}

async function boot() {
  setUnauthorizedHandler(() => showLogin('Your session ended. Please log in again.'));
  try {
    await api.me();
    await showDashboard();
  } catch (err) {
    if (err.status === 401) showLogin(); else showProblem(err.message);
  }
}

addEventListener('beforeunload', e => { if (state.dirty) { e.preventDefault(); e.returnValue = ''; } });
boot();