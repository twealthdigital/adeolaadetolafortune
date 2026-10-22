// Sliding active bar + scroll tracking. Works with the header from components/header.js.
export function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  const links = [...nav.querySelectorAll('.nav__link')];
  const bar = nav.querySelector('.nav__bar');
  const byId = id => links.find(l => l.dataset.section === id);
  const sections = links.map(l => document.getElementById(l.dataset.section)).filter(Boolean);

  let current = null;
  let locked = false;
  let lockTimer;

  const place = link => {
    if (!link) return;
    bar.style.width = link.offsetWidth + 'px';
    bar.style.transform = `translateX(${link.offsetLeft}px)`;
  };

  const activate = link => {
    if (!link || link === current) return;
    current = link;
    links.forEach(l => {
      const on = l === link;
      l.classList.toggle('is-active', on);
      if (on) l.setAttribute('aria-current', 'page'); else l.removeAttribute('aria-current');
    });
    place(link);
  };

  if (sections.length) {
    // Landing page: follow the section in the middle of the screen.
    const io = new IntersectionObserver(entries => {
      if (locked) return;
      entries.forEach(e => { if (e.isIntersecting) activate(byId(e.target.id)); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => io.observe(s));

    // Clicking a tab moves the bar straight to it, not through every section on the way.
    links.forEach(l => l.addEventListener('click', () => {
      locked = true;
      activate(l);
      clearTimeout(lockTimer);
      lockTimer = setTimeout(() => { locked = false; }, 900);
    }));

    // Last section is short? Still light it up at the bottom.
    addEventListener('scroll', () => {
      if (!locked && innerHeight + scrollY >= document.documentElement.scrollHeight - 4) {
        activate(links[links.length - 1]);
      }
    }, { passive: true });

    activate(byId(location.hash.slice(1)) || links[0]);
  } else {
    // Other pages: set <body data-active="projects"> to pick the tab.
    activate(byId(document.body.dataset.active));
  }

  requestAnimationFrame(() => nav.classList.add('is-ready'));
  new ResizeObserver(() => place(current)).observe(nav);
  document.fonts?.ready.then(() => place(current));
}