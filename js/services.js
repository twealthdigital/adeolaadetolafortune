// Infinite services carousel. The card in the middle turns yellow, it moves every 3 seconds,
// and it also works with dots, arrows (desktop) and swipe or drag.
const AUTOPLAY_MS = 3000;

export function initServicesCarousel() {
  const root = document.querySelector('[data-carousel]');
  if (!root) return;

  const viewport = root.querySelector('.carousel__viewport');
  const track = root.querySelector('.carousel__track');
  const dotsHost = root.querySelector('.carousel__dots');
  const prevBtn = root.querySelector('[data-prev]');
  const nextBtn = root.querySelector('[data-next]');

  const originals = [...track.children];
  const n = originals.length;
  if (n < 2) return;

  // One full set of clones on each side makes the loop endless.
  const makeClone = el => {
    const c = el.cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    c.querySelectorAll('button, a').forEach(x => { x.tabIndex = -1; });
    return c;
  };
  track.prepend(...originals.map(makeClone));
  track.append(...originals.map(makeClone));
  const slides = [...track.children];

  // Dots
  const dots = originals.map((_, i) => {
    const d = document.createElement('button');
    d.type = 'button';
    d.className = 'carousel__dot';
    d.setAttribute('aria-label', `Show service ${i + 1} of ${n}`);
    d.addEventListener('click', () => {
      let delta = i - logical();
      if (delta > n / 2) delta -= n;
      if (delta < -n / 2) delta += n;
      move(delta);
      start();
    });
    dotsHost.append(d);
    return d;
  });

  let pos = n; // index in slides, the real cards live between n and 2n - 1
  const logical = () => ((pos % n) + n) % n;

  const offsetFor = i => {
    const s = slides[i];
    return viewport.clientWidth / 2 - (s.offsetLeft + s.offsetWidth / 2);
  };

  // The yellow only appears once the card has stopped in the middle.
  // Every new move or drag cancels it, so fast swiping never flashes yellow on the cards passing by.
  const SETTLE_MS = 750; // slide time (.6s) + a short pause
  let settleTimer = null;
  const applyActive = () => {
    clearTimeout(settleTimer);
    slides.forEach((s, i) => s.classList.toggle('is-active', i === pos));
  };
  const clearActive = () => {
    clearTimeout(settleTimer);
    slides.forEach(s => s.classList.remove('is-active'));
  };
  const queueActive = () => {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(applyActive, SETTLE_MS);
  };

  const render = animate => {
    track.style.transition = animate ? '' : 'none';
    track.style.transform = `translate3d(${offsetFor(pos)}px, 0, 0)`;
    if (animate) { clearActive(); queueActive(); } else { applyActive(); }
    dots.forEach((d, i) => {
      const on = i === logical();
      d.classList.toggle('is-active', on);
      if (on) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
    });
    if (!animate) void track.offsetWidth; // flush, so the next move animates from here
  };

  // Jump back into the real set without animation (the clones look identical, so nobody sees it).
  const normalise = () => {
    if (pos >= 2 * n) pos -= n;
    else if (pos < n) pos += n;
    else return;
    render(false);
  };

  const move = d => {
    normalise();
    pos += Math.max(-n, Math.min(n, d));
    render(true);
  };

  track.addEventListener('transitionend', e => {
    if (e.target === track && e.propertyName === 'transform') normalise();
  });

  // Autoplay
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let timer = null;
  const stop = () => { clearInterval(timer); timer = null; };
  const start = () => {
    stop();
    if (reduce.matches || document.hidden) return;
    timer = setInterval(() => move(1), AUTOPLAY_MS);
  };
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  root.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') stop(); });
  root.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') start(); });
  root.addEventListener('focusin', e => { if (e.target.matches(':focus-visible')) stop(); });
  root.addEventListener('focusout', start);

  // Arrows
  prevBtn?.addEventListener('click', () => { move(-1); start(); });
  nextBtn?.addEventListener('click', () => { move(1); start(); });

  // Tap a side card to bring it to the middle
  track.addEventListener('click', e => {
    if (e.target.closest('.svc__go')) return;
    const s = e.target.closest('.svc');
    const i = slides.indexOf(s);
    if (i > -1 && i !== pos) { move(i - pos); start(); }
  });

  // Swipe or drag
  let down = false, moved = false, suppressClick = false, startX = 0, startOffset = 0, dx = 0;

  viewport.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    down = true; moved = false; dx = 0; startX = e.clientX;
    stop();
    normalise();
    startOffset = offsetFor(pos);
  });

  viewport.addEventListener('pointermove', e => {
    if (!down) return;
    dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > 6) {
      moved = true;
      viewport.setPointerCapture(e.pointerId);
      root.classList.add('is-dragging');
      clearActive();
      track.style.transition = 'none';
    }
    if (moved) track.style.transform = `translate3d(${startOffset + dx}px, 0, 0)`;
  });

  const endDrag = () => {
    if (!down) return;
    down = false;
    root.classList.remove('is-dragging');
    if (moved) {
      const step = slides[1].offsetLeft - slides[0].offsetLeft;
      let d = -Math.round(dx / step);
      if (d === 0 && Math.abs(dx) > 40) d = dx < 0 ? 1 : -1;
      if (d === 0) render(true); else move(d);
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);
    }
    start();
  };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  // A drag must never count as a click on a card
  viewport.addEventListener('click', e => {
    if (suppressClick) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  new ResizeObserver(() => render(false)).observe(viewport);
  document.fonts?.ready.then(() => render(false));

  render(false);
  start();
}