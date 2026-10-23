// Experience timeline: an endless carousel that steps one card at a time, like the Services carousel.
// The real list sits between two copies, so the scroll position can jump by one list-height unseen.
const AUTOPLAY_MS = 3600;     // one full step: gold line travels, then the card slides, then it rests
const TRAVEL_MS = 480;        // gold running down the line to the next dot
const SLIDE_MS = 600;         // card slide time (same as the services carousel)

// cubic-bezier(.65, 0, .15, 1): the easing the services carousel uses in CSS
const bezier = (x1, y1, x2, y2) => t => {
  const c = (a, b, s) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
  let lo = 0, hi = 1, s = t;
  for (let i = 0; i < 24; i++) { s = (lo + hi) / 2; if (c(x1, x2, s) < t) lo = s; else hi = s; }
  return c(y1, y2, s);
};
const ease = bezier(.65, 0, .15, 1);

export function initExperience() {
  const root = document.querySelector('.xp');
  const panel = root?.querySelector('[data-xp-panel]');
  const list = root?.querySelector('[data-xp-list]');
  if (!root || !panel || !list) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const real = [...list.querySelectorAll('.xp__item')];
  const N = real.length;
  real.forEach((li, i) => { li.dataset.i = i; });

  // Copies are visual only: hidden from screen readers and the tab order.
  const makeCopy = () => real.map(li => {
    const c = li.cloneNode(true);
    c.classList.add('is-copy');
    c.setAttribute('aria-hidden', 'true');
    c.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
    c.querySelectorAll('[aria-labelledby]').forEach(n => n.removeAttribute('aria-labelledby'));
    c.querySelectorAll('button, [tabindex]').forEach(n => n.setAttribute('tabindex', '-1'));
    return c;
  });
  const before = makeCopy();
  const after = makeCopy();
  list.prepend(...before);
  list.append(...after);

  const all = [...before, ...real, ...after];
  const cards = all.map(li => li.querySelector('.xp__card'));
  const realDots = real.map(li => li.querySelector('[data-xp-dot]'));

  // The gold that runs along the line from one dot to the next
  const track = list.parentElement;
  const flow = document.createElement('span');
  flow.className = 'xp__flow';
  flow.setAttribute('aria-hidden', 'true');
  track.append(flow);

  let H = 0;                  // height of one full list, including the gap after it
  let lastW = 0;
  let busy = false;           // a slide is in progress
  let tween = 0;

  const padTop = () => parseFloat(getComputedStyle(panel).paddingTop) || 0;

  // The card we step to sits at the top of the panel, with the next ones queued below it.
  // (offsetTop ignores the fade-in offset that cards not yet seen still carry)
  const targetOf = li => li.offsetTop;

  // Sizes: one list height, and the tallest card so that exactly two fit the panel on small screens.
  const measure = () => {
    if (panel.clientWidth === lastW && H) return;
    lastW = panel.clientWidth;
    root.style.removeProperty('--xp-card-h');
    const tallest = Math.max(...cards.map(c => c.offsetHeight));
    root.style.setProperty('--xp-card-h', tallest + 'px');
    const old = H;
    H = real[0].offsetTop - before[0].offsetTop;
    if (!old) panel.scrollTop = H - padTop(); else if (old !== H) panel.scrollTop *= H / old;
  };

  /* ---------- active dot ---------- */
  let currentEl = null;

  const activate = li => {
    if (!li || li === currentEl) return;
    currentEl?.classList.remove('is-active');
    currentEl?.querySelector('[data-xp-dot]').classList.remove('is-active');
    currentEl = li;
    li.classList.add('is-active');
    li.querySelector('[data-xp-dot]').classList.add('is-active');
    realDots.forEach((d, n) => {
      if (n === Number(li.dataset.i)) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
    });
  };

  // Jump back by one list-height when we get near either end (looks identical, so nobody sees it).
  const wrap = () => {
    if (!H || busy) return;
    const t = panel.scrollTop;
    const shift = t >= 2 * H ? -H : t <= 1 ? H : 0;
    if (!shift) return;
    panel.scrollTop = t + shift;
    const at = all.indexOf(currentEl);
    if (all[at + Math.sign(shift) * N]) activate(all[at + Math.sign(shift) * N]);
  };
  panel.addEventListener('scroll', wrap, { passive: true });

  // Which card is at the top while the person scrolls by hand.
  const band = new IntersectionObserver(entries => {
    if (busy) return;
    const hit = entries.filter(e => e.isIntersecting).pop();
    if (hit) activate(hit.target.closest('.xp__item'));
  }, { root: panel, rootMargin: '-6% 0px -88% 0px' });
  cards.forEach(c => band.observe(c));

  // Entrance animation: each item fades in the first time it scrolls into view.
  const seen = new IntersectionObserver((entries, o) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-seen'); o.unobserve(e.target); } });
  }, { root: panel, rootMargin: '0px 0px -4% 0px', threshold: 0.05 });
  all.forEach(li => seen.observe(li));

  /* ---------- sliding ---------- */
  const slideTo = (top, done) => {
    cancelAnimationFrame(tween);
    busy = true;
    const from = panel.scrollTop;
    const t0 = performance.now();
    const finish = () => { busy = false; wrap(); done?.(); };
    if (reduce.matches || Math.abs(top - from) < 1) { panel.scrollTop = top; finish(); return; }
    const frame = now => {
      const p = Math.min(1, (now - t0) / SLIDE_MS);
      panel.scrollTop = from + (top - from) * ease(p);
      if (p < 1) tween = requestAnimationFrame(frame); else finish();
    };
    tween = requestAnimationFrame(frame);
  };
  // Gold line: grows from the dot we are on to the dot we are going to, then the card slides.
  let travelTimer = 0;
  let fadeTimer = 0;
  const dotY = li => {
    const d = li.querySelector('[data-xp-dot]');
    return li.offsetTop + d.offsetTop + d.offsetHeight / 2;
  };
  const travel = (from, to, done) => {
    if (reduce.matches || !from || from === to) { done(); return; }
    const a = dotY(from);
    const b = dotY(to);
    clearTimeout(fadeTimer);
    flow.style.transition = 'none';
    flow.classList.toggle('is-up', b < a);
    flow.style.top = Math.min(a, b) + 'px';
    flow.style.height = Math.abs(b - a) + 'px';
    flow.style.opacity = '1';
    flow.style.transform = 'scaleY(0)';
    void flow.offsetHeight;                       // lets the browser see the starting state
    flow.style.transition = `transform ${TRAVEL_MS}ms cubic-bezier(.4, 0, .2, 1)`;
    flow.style.transform = 'scaleY(1)';
    travelTimer = setTimeout(() => {
      done();
      flow.style.transition = 'opacity .5s ease';
      flow.style.opacity = '0';
    }, TRAVEL_MS);
  };
  const move = li => {
    clearTimeout(travelTimer);
    busy = true;
    travel(currentEl, li, () => { activate(li); slideTo(targetOf(li)); });
  };

  const stopSlide = () => {
    cancelAnimationFrame(tween);
    clearTimeout(travelTimer);
    flow.style.opacity = '0';
    busy = false;
  };

  let resumeAt = 0;
  const hold = ms => { resumeAt = Math.max(resumeAt, performance.now() + ms); };

  // Move to a card (dots and keys). Mouse takes the closest copy, keyboard keeps the real focusable one.
  const goTo = (i, byKey) => {
    const copies = [before[i], real[i], after[i]];
    const li = byKey ? real[i] : copies.reduce((a, b) =>
      Math.abs(targetOf(b) - panel.scrollTop) < Math.abs(targetOf(a) - panel.scrollTop) ? b : a);
    hold(AUTOPLAY_MS + 2000);
    move(li);
  };

  const step = () => {
    const next = all[all.indexOf(currentEl) + 1] || real[0];
    move(next);
  };

  all.forEach(li => {
    const dot = li.querySelector('[data-xp-dot]');
    const i = Number(li.dataset.i);
    dot.addEventListener('click', () => goTo(i, !li.classList.contains('is-copy') && dot.matches(':focus-visible')));
    dot.addEventListener('keydown', e => {
      const next = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: N - 1 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      const n = (next + N) % N;
      realDots[n].focus({ preventScroll: true });
      goTo(n, true);
    });
  });

  /* ---------- autoplay ---------- */
  let visible = false;
  let hovering = false;
  let focusing = false;
  let touching = false;
  let nextAt = performance.now() + AUTOPLAY_MS;

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(root);

  panel.addEventListener('mouseenter', () => { hovering = true; });
  panel.addEventListener('mouseleave', () => { hovering = false; });
  panel.addEventListener('focusin', e => { focusing = e.target.matches(':focus-visible'); });
  panel.addEventListener('focusout', () => { focusing = false; });
  panel.addEventListener('touchstart', () => { touching = true; stopSlide(); }, { passive: true });
  panel.addEventListener('touchend', () => { touching = false; hold(AUTOPLAY_MS); }, { passive: true });
  panel.addEventListener('touchcancel', () => { touching = false; hold(AUTOPLAY_MS); }, { passive: true });
  panel.addEventListener('wheel', () => { stopSlide(); hold(AUTOPLAY_MS); }, { passive: true });

  const tick = now => {
    const run = H && visible && !document.hidden && !reduce.matches && !hovering && !focusing && !touching && !busy && now >= resumeAt;
    if (!run) nextAt = Math.max(nextAt, now + 400);          // wait a moment after anything pauses us
    else if (now >= nextAt) { step(); nextAt = now + AUTOPLAY_MS; }
    requestAnimationFrame(tick);
  };

  /* ---------- start ---------- */
  new ResizeObserver(() => measure()).observe(panel);
  document.fonts?.ready.then(() => { lastW = 0; measure(); });
  root.classList.add('is-ready');
  measure();
  activate(real[0]);
  requestAnimationFrame(tick);
}