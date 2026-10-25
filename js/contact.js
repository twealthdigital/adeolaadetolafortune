// Contact form (sends through Web3Forms).
// The admin saves the access key + subject in this browser (local mode); read them back here.
const savedSettings = () => { try { return JSON.parse(localStorage.getItem('portfolio.settings')) || {}; } catch { return {}; } };

// The key and subject come from the backend (the Contact form tab in the admin). With no backend running,
// the ones saved in this browser (local mode) are used instead.
let configPromise;
const contactConfig = () => configPromise ||= (async () => {
  try {
    const res = await fetch('/api/contact-config', { headers: { Accept: 'application/json' } });
    if (res.ok) { const j = await res.json(); return { web3formsKey: j.key || '', subject: j.subject || '' }; }
  } catch { /* no backend, use the local settings */ }
  return savedSettings();
})();

const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const CHEVRON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

// A styled dropdown for the "service" field. The real <select> stays (hidden) so the form still sends it.
// Choosing "Other" turns the box into a text field, so the visitor can type their own service.
// Returns a function that gives the typed service ('' when not used).
function enhanceService(form) {
  const select = form.querySelector('select[name="service"]');
  if (!select || select.dataset.enhanced) return () => '';
  select.dataset.enhanced = '1';

  const placeholder = (select.options[0]?.textContent || 'Choose one').trim();
  const options = [...select.options].slice(1).map(o => (o.value || o.textContent).trim());
  const OTHER = options.find(v => /^other$/i.test(v)) || '';

  select.hidden = true;
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');

  const wrap = document.createElement('div');
  wrap.className = 'cdd';
  wrap.innerHTML = `
    <button class="cdd__btn" type="button" aria-haspopup="listbox" aria-expanded="false"><span class="cdd__val is-placeholder">${esc(placeholder)}</span></button>
    <input class="cdd__other" type="text" maxlength="60" placeholder="Type the service you need" autocomplete="off" aria-label="Service you're interested in" hidden>
    <button class="cdd__chev" type="button" tabindex="-1" aria-label="Choose from the list">${CHEVRON}</button>
    <ul class="cdd__menu" role="listbox" aria-label="Service you're interested in">
      ${options.map(o => `<li class="cdd__opt" role="option" tabindex="-1" aria-selected="false" data-v="${esc(o)}"><span>${esc(o)}</span>${CHECK}</li>`).join('')}
    </ul>`;
  select.after(wrap);

  const btn = wrap.querySelector('.cdd__btn');
  const val = wrap.querySelector('.cdd__val');
  const other = wrap.querySelector('.cdd__other');
  const chev = wrap.querySelector('.cdd__chev');
  const menu = wrap.querySelector('.cdd__menu');
  const opts = () => [...menu.querySelectorAll('.cdd__opt')];
  const isOpen = () => wrap.classList.contains('is-open');
  let custom = false;

  // open upwards when there is no room below (keeps clear of the phone tab bar)
  const place = () => {
    wrap.classList.remove('is-up');
    const r = wrap.getBoundingClientRect();
    const tab = innerWidth <= 760 ? parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tabbar-h')) || 0 : 0;
    const need = menu.offsetHeight + 10;
    const below = innerHeight - tab - r.bottom;
    if (need > below && r.top > below) wrap.classList.add('is-up');
  };
  const open = () => { place(); wrap.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); };
  const close = (refocus = false) => {
    if (!isOpen()) return;
    wrap.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    if (refocus) (custom ? other : btn).focus();
  };
  const toggle = () => (isOpen() ? close() : open());
  const focusOpt = i => { const l = opts(); if (l.length) l[(i + l.length) % l.length].focus(); };
  const openAndFocus = () => { open(); focusOpt(Math.max(0, opts().findIndex(o => o.getAttribute('aria-selected') === 'true'))); };

  const show = (v, isCustom) => {
    custom = isCustom;
    select.value = v;
    opts().forEach(o => o.setAttribute('aria-selected', String(!!v && o.dataset.v === v)));
    wrap.classList.toggle('is-custom', isCustom);
    btn.hidden = isCustom;
    other.hidden = !isCustom;
    if (!isCustom) {
      other.value = '';
      val.textContent = v || placeholder;
      val.classList.toggle('is-placeholder', !v);
    }
  };
  const pick = v => {
    if (OTHER && v === OTHER) { show(v, true); close(); other.focus(); return; }
    show(v, false);
    close(true);
  };

  btn.addEventListener('click', toggle);
  chev.addEventListener('click', toggle);
  [btn, other].forEach(el => el.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || (e.key === 'ArrowUp' && el === btn)) { e.preventDefault(); openAndFocus(); }
  }));
  menu.addEventListener('click', e => { const o = e.target.closest('.cdd__opt'); if (o) pick(o.dataset.v); });
  menu.addEventListener('keydown', e => {
    const i = opts().indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); focusOpt(i + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); focusOpt(i - 1); }
    else if (e.key === 'Home') { e.preventDefault(); focusOpt(0); }
    else if (e.key === 'End') { e.preventDefault(); focusOpt(-1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (i > -1) pick(opts()[i].dataset.v); }
    else if (e.key === 'Tab') close();
  });
  document.addEventListener('pointerdown', e => { if (isOpen() && !wrap.contains(e.target)) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) close(true); });
  addEventListener('resize', () => { if (isOpen()) place(); });
  form.addEventListener('reset', () => setTimeout(() => show('', false), 0));

  return () => (custom ? other.value.trim() : '');
}

export function initContact() {
  const form = document.getElementById('contact-form');
  const note = document.getElementById('contact-note');
  if (!form || !note) return;
  const customService = enhanceService(form);

  const say = (text, type) => { note.textContent = text; note.className = 'contact__note ' + (type || ''); };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const data = new FormData(form);
    const typedService = customService();            // "Other" + what they typed
    if (typedService) data.set('service', typedService);
    const name = String(data.get('name') || '').trim();

    if (!name || !String(data.get('email') || '').trim() || !String(data.get('message') || '').trim()) {
      return say('Please fill in your name, email and message.', 'is-error');
    }

    // The key you paste in the admin (Contact form tab) is used here. Until one is saved, the form says so.
    const saved = await contactConfig();
    const key = String(saved.web3formsKey || data.get('access_key') || '').trim();
    if (!key || key === 'YOUR_ACCESS_KEY') {
      return say('The contact form is not connected yet. Please email me directly.', 'is-error');
    }
    data.set('access_key', key);
    if (saved.subject) data.set('subject', saved.subject);

    const btn = form.querySelector('button[type="submit"]');
    const old = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = 'Sending...';

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: data
      });
      const json = await res.json();
      if (json.success) {
        say(`Thanks ${name.split(' ')[0]}! Your message has been sent.`, 'is-success');
        form.reset();
      } else {
        console.error('Web3Forms said:', json);   // open the browser console (F12) to see the exact reason
        say(/access key/i.test(json.message || '')
          ? 'The contact form key is not valid. Please email me directly.'
          : 'Something went wrong. Please try again or email me directly.', 'is-error');
      }
    } catch {
      say('Network error. Please email me directly.', 'is-error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = old;
    }
  });
}