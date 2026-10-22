// About section: numbers count up when the stats scroll into view.
const ease = t => 1 - Math.pow(1 - t, 3);

export function initAbout() {
  const root = document.querySelector('.about');
  const stats = root?.querySelector('.about__stats');
  if (!root || !stats) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const run = () => {
    root.classList.add('is-in');
    if (reduce) return;
    root.querySelectorAll('[data-count]').forEach(el => {
      const end = Number(el.dataset.count);
      const t0 = performance.now();
      const DURATION = 1600;
      el.textContent = '0';
      const tick = now => {
        const p = Math.min(1, (now - t0) / DURATION);
        el.textContent = Math.round(end * ease(p));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  };

  new IntersectionObserver((entries, io) => {
    if (entries[0].isIntersecting) { run(); io.disconnect(); }
  }, { threshold: 0.4 }).observe(stats);
}