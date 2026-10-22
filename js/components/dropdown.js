// Reusable dropdown. Works on any element with [data-dropdown].
//
// <div class="dropdown" data-dropdown>
//   <button class="btn btn--icon dropdown__trigger" type="button" data-dropdown-trigger
//           aria-haspopup="menu" aria-expanded="false" aria-label="More options">…chevron svg…</button>
//   <div class="dropdown__menu" role="menu">
//     <a class="dropdown__item" role="menuitem" href="#contact">Get in touch</a>
//     <button class="dropdown__item" role="menuitem" type="button" data-action="share">Share</button>
//   </div>
// </div>
//
// Items with data-action fire a "dropdown:select" event ({ detail: { action, item } }) on document.
// Links just navigate. Menu closes after any pick, on outside click, on Esc.

const GAP = 12; // minimum space kept from the screen edge

export function initDropdowns(root = document) {
  root.querySelectorAll('[data-dropdown]').forEach(setup);
}

function setup(dd) {
  if (dd.dataset.ready) return;
  dd.dataset.ready = '1';

  const trigger = dd.querySelector('[data-dropdown-trigger]');
  const menu = dd.querySelector('.dropdown__menu');
  if (!trigger || !menu) return;

  const items = () => [...menu.querySelectorAll('[role="menuitem"]')];
  const isOpen = () => dd.classList.contains('is-open');

  function place() {
    dd.classList.remove('is-up');
    menu.style.removeProperty('--dx');

    const t = trigger.getBoundingClientRect();
    const tabbar = innerWidth <= 760 ? parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tabbar-h')) || 0 : 0;

    // Flip up only if it doesn't fit below AND fully fits above (clear of the header).
    const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
    const need = menu.offsetHeight + 10;
    const below = innerHeight - tabbar - t.bottom;
    const above = t.top - headerH;
    if (need > below && above >= need) dd.classList.add('is-up');

    // Slide sideways so it never leaves the screen.
    let dx = 0;
    const left = t.left;
    const right = left + menu.offsetWidth;
    if (right > innerWidth - GAP) dx = innerWidth - GAP - right;
    if (left + dx < GAP) dx = GAP - left;
    menu.style.setProperty('--dx', dx + 'px');
  }

  function open() {
    document.querySelectorAll('[data-dropdown].is-open').forEach(o => o !== dd && o.dispatchEvent(new Event('dropdown:close')));
    place();
    dd.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
  }

  function close(returnFocus = false) {
    if (!isOpen()) return;
    dd.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    if (returnFocus) trigger.focus();
  }

  dd.addEventListener('dropdown:close', () => close());

  trigger.addEventListener('click', () => (isOpen() ? close() : open()));

  trigger.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!isOpen()) open(); items()[0]?.focus(); }
  });

  menu.addEventListener('keydown', e => {
    const list = items();
    const i = list.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); list[(i + 1) % list.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); list[(i - 1 + list.length) % list.length].focus(); }
    else if (e.key === 'Home') { e.preventDefault(); list[0].focus(); }
    else if (e.key === 'End') { e.preventDefault(); list[list.length - 1].focus(); }
    else if (e.key === 'Tab') close();
  });

  menu.addEventListener('click', e => {
    const item = e.target.closest('[role="menuitem"]');
    if (!item) return;
    const action = item.dataset.action;
    if (action) {
      document.dispatchEvent(new CustomEvent('dropdown:select', { detail: { action, item } }));
      // Give "Copied!" style feedback a moment before closing.
      setTimeout(() => close(), item.dataset.keepOpen ? 900 : 0);
    } else {
      close();
    }
  });

  document.addEventListener('pointerdown', e => { if (isOpen() && !dd.contains(e.target)) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) close(true); });
  addEventListener('resize', () => { if (isOpen()) place(); });
  addEventListener('scroll', () => { if (isOpen()) place(); }, { passive: true });
}