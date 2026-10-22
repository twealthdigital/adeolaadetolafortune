// Reusable header. Import and call mountHeader() on every page.
const ICONS = {
  home: '<path d="M12 3 2 12h3v8h5v-6h4v6h5v-8h3L12 3z"/>',
  about: '<circle cx="12" cy="8" r="4.5"/><path d="M3.5 21c0-4.4 3.8-7 8.5-7s8.5 2.6 8.5 7z"/>',
  services: '<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/>',
  experience: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2h-2V5h-4v2z"/>',
  contact: '<path d="M3 5h18a1 1 0 0 1 1 1v.5l-10 6.5L2 6.5V6a1 1 0 0 1 1-1z"/><path d="M2 9l10 6.5L22 9v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/>'
};

const NAV = [
  { id: 'home', label: 'Home' },
  { id: 'services', label: 'Services' },
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'contact', label: 'Contact' }
];

export function mountHeader(target = '#site-header') {
  const host = document.querySelector(target);
  if (!host) return;

  // On the landing page links scroll; on other pages they go back to the landing sections.
  const prefix = document.body.dataset.page === 'landing' ? '#' : '/#';

  const items = NAV.map(n => `
    <li>
      <a class="nav__link" href="${prefix}${n.id}" data-section="${n.id}">
        <svg class="nav__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${ICONS[n.id]}</svg>
        <span>${n.label}</span>
      </a>
    </li>`).join('');

  host.innerHTML = `
    <header class="header">
      <div class="container header__inner">
        <a class="header__logo" href="/" aria-label="!Fortune home">
          <img src="/assets/images/logo-if.webp" alt="!F logo, yellow exclamation mark beside a white F on black" width="44" height="44">
        </a>

        <nav class="nav" aria-label="Main">
          <ul class="nav__list">${items}</ul>
          <span class="nav__bar" aria-hidden="true"></span>
        </nav>

        <a class="btn btn--primary header__cta" href="${prefix}contact">
          Hire me
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>
        </a>
      </div>
    </header>`;
}