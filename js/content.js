// Loads the site's content: live backend first, then the static file (so it works with no server).
let cache;
export function getContent() {
  cache ||= (async () => {
    for (const url of ['/api/content', 'local', '/content/content.json']) {
      if (url === 'local') {   // edits saved by the admin in local mode (no backend)
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