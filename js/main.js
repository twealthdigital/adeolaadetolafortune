import { mountHeader } from './components/header.js';
import { initDropdowns } from './components/dropdown.js';
import { initNav } from './navigation.js';
import { initServicesCarousel } from './services.js';
import { initExperience } from './experience.js';
import { initContact } from './contact.js';
import { initServicesDashboard } from './services-dashboard.js';
import { getContent, renderExperience } from './content.js';
import { initAboutDashboard } from './about-dashboard.js';

mountHeader('#site-header');

// Loading screen: fades out once the page and fonts are ready (shows for at least 600ms so it never just flashes)
(() => {
  const loader = document.getElementById('loader');
  if (!loader) return;
  const MIN_MS = 1200;
  const t0 = performance.now();
  const loaded = document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise(r => addEventListener('load', r, { once: true }));
  Promise.all([loaded, document.fonts?.ready]).then(() => {
    setTimeout(() => {
      loader.classList.add('is-done');
      setTimeout(() => loader.remove(), 500);
    }, Math.max(0, MIN_MS - (performance.now() - t0)));
  });
})();
initNav();
initServicesCarousel();
getContent().then(c => { renderExperience(c && c.experience); initExperience(); });
initContact();
initServicesDashboard();
initAboutDashboard();
initDropdowns();

// Footer year: updates itself every January
document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

// Dropdown actions (items with data-action="...")
document.addEventListener('dropdown:select', async e => {
  const { action, item } = e.detail;
  const data = { title: document.title, url: location.href };
  const label = item.querySelector('span');

  const flash = text => {
    if (!label) return;
    const old = label.textContent;
    label.textContent = text;
    item.classList.add('is-done');
    setTimeout(() => { label.textContent = old; item.classList.remove('is-done'); }, 900);
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(data.url); flash('Link copied!'); }
    catch { flash('Copy failed'); }
  };

  if (action === 'copy') return copy();

  if (action === 'share') {
    try {
      if (navigator.share) await navigator.share(data);
      else await copy();
    } catch { /* cancelled */ }
  }
});

// Tags marquee (mobile only, see hero.css). Wraps the tags and adds a hidden duplicate set for a seamless loop.
(() => {
  const tags = document.querySelector('.tags');
  if (!tags || tags.parentElement.classList.contains('tags-wrap')) return;

  const wrap = document.createElement('div');
  wrap.className = 'tags-wrap';
  tags.parentNode.insertBefore(wrap, tags);
  wrap.appendChild(tags);

  [...tags.children].forEach(li => {
    const clone = li.cloneNode(true);
    clone.classList.add('tag--clone');
    clone.setAttribute('aria-hidden', 'true');
    tags.appendChild(clone);
  });
})();

 