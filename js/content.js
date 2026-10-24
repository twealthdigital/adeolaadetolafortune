// Loads the site's content: live backend first, then the static file (so it works with no server).
let cache;
export function getContent() {
  cache ||= (async () => {
    for (const url of ['/api/content', 'local', '/content/content.json']) {
      if (url === 'local') {
        try { const l = JSON.parse(localStorage.getItem('portfolio.content')); if (l) return l; } catch { /* none */ }
        continue;
      }
      try {
        const r = await fetch(url, { headers: { Accept: 'application/json' } });
        if (r.ok) return await r.json();
      } catch { /* try the next one */ }
    }
    return { services: [], about: {} };
  })();
  return cache;
}

// Builds the homepage "My Experience" cards from content.json.
// If there is no experience in the content (or no server), the cards already in index.html stay untouched.
export function renderExperience(items) {
  const list = document.querySelector('[data-xp-list]');
  if (!list || !Array.isArray(items) || !items.length) return;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  list.innerHTML = items.map((x, i) => `
    <li class="xp__item">
      <button class="xp__dot" type="button" data-xp-dot aria-label="Go to experience ${i + 1} of ${items.length}: ${esc(x.name)}"></button>
      <article class="xp__card" tabindex="-1" aria-labelledby="xp-t${i + 1}">
        <div class="xp__top">
          <span class="xp__num">${String(i + 1).padStart(2, '0')}</span>
        </div>
        <h3 class="xp__name" id="xp-t${i + 1}">${esc(x.name)}</h3>
        <p class="xp__desc">${esc(x.desc)}</p>
        <ul class="xp__skills" aria-label="Skills">${(x.skills || []).map(s => `<li>${esc(s)}</li>`).join('')}</ul>
      </article>
    </li>`).join('');
}


// Builds the homepage services carousel from the services in the content.
// If there are no services (or no server), the cards already in index.html stay untouched.
export function renderServices(items) {
  const track = document.querySelector('[data-carousel] .carousel__track');
  if (!track || !Array.isArray(items) || !items.length) return;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fallback = { web: 'web.png', ai: 'ai.png', mobile: 'mobile.png', uiux: 'mobile.png' };
  const cover = s => s.cover || (fallback[s.id] ? `/assets/images/services.images/${fallback[s.id]}` : '/assets/images/fortune-portrait.webp');
  track.innerHTML = items.map(s => `
    <li class="svc">
      <h3 class="svc__label">${esc(s.title)}</h3>
      <div class="svc__stage">
        <img class="svc__img" src="${esc(cover(s))}" alt="Preview of ${esc(s.title)}" width="480" height="300" loading="lazy" draggable="false">
        <button class="svc__go" type="button" aria-label="Explore ${esc(s.title)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>
        </button>
      </div>
    </li>`).join('');
}