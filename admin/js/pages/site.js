// SITE SETTINGS: logo, favicon, hero text, contact details and social links.
// Whatever is saved here is used everywhere on the website (see js/site.js).
import { esc, text, area, file, pick, tools, addBtn, bindForm } from '../ui.js';
import { SOCIAL_NETWORKS, getSite } from '../../../js/site.js';

const blankSocial = () => ({ network: 'linkedin', url: '' });
const nameOf = n => (SOCIAL_NETWORKS.find(x => x[0] === n) || [n, n])[1];

export function mount(box, shell) {
  const about = () => shell.content.about || {};
  // "since" belongs to the About page. It is shown here too so the years of experience are easy to find.
  const load = () => ({ ...getSite(shell.content), since: Number(about().since) || 2022 });
  const model = load();
  let fresh = false;

  const card = (title, body, note = '') => `
    <div class="card">
      <div class="card__head"><strong class="card__title">${esc(title)}</strong></div>
      <div class="card__body">${note ? `<p class="intro">${note}</p>` : ''}${body}</div>
    </div>`;

  const social = (s, i) => `
    <div class="row">
      <div class="row__fields">
        ${pick({ label: 'Network', path: `socials.${i}.network`, v: s.network, options: SOCIAL_NETWORKS })}
        ${text({ label: 'Link', path: `socials.${i}.url`, v: s.url, type: 'url', ph: 'https://', hint: 'The full link to your profile. WhatsApp can stay empty to use your phone number.' })}
      </div>
      ${tools('socials', i, model.socials.length, nameOf(s.network))}
    </div>`;

  const draw = () => {
    const m = model;
    box.innerHTML = `
      <p class="intro">Change something here once and it updates <b>everywhere</b> it appears on the website.</p>

      ${card('Brand', `
        ${file({ label: 'Logo', path: 'brand.logo', v: m.brand.logo, accept: 'image/*', hint: 'Shown in the website header.' })}
        ${file({ label: 'Favicon', path: 'brand.favicon', v: m.brand.favicon, accept: 'image/*,.ico', hint: 'The small icon in the browser tab. A square picture works best.' })}
        ${text({ label: 'Website title', path: 'brand.title', v: m.brand.title, hint: 'Shown in the browser tab and on Google.' })}
        ${area({ label: 'Website description', path: 'brand.description', v: m.brand.description, rows: 2, hint: 'The short text Google shows under your title.' })}
        ${text({ label: 'Name in the footer', path: 'brand.footer', v: m.brand.footer })}`)}

      ${card('Hero (top of the homepage)', `
        ${file({ label: 'Photo', path: 'hero.photo', v: m.hero.photo, accept: 'image/*' })}
        ${text({ label: 'Name line', path: 'hero.name', v: m.hero.name })}
        ${text({ label: 'Headline', path: 'hero.headline', v: m.hero.headline })}
        ${area({ label: 'Short bio', path: 'hero.bio', v: m.hero.bio, rows: 3 })}
        <div class="grid-2">
          ${text({ label: 'First button', path: 'hero.primary', v: m.hero.primary })}
          ${text({ label: 'Second button', path: 'hero.secondary', v: m.hero.secondary })}
        </div>
        ${text({ label: 'Tags', path: 'hero.tags', v: m.hero.tags, as: 'csv', hint: 'Separate with commas.' })}`)}

      ${card('Homepage About', `
        ${text({ label: 'Headline', path: 'about.headline', v: m.about.headline, hint: 'Put *stars* around the words that should turn yellow.' })}`,
        'The text under this headline is the first paragraph you wrote on the About page.')}

      ${card('Years of experience', `
        ${text({ label: 'Year you started', path: 'since', v: m.since, as: 'number', type: 'number', hint: 'The years of experience on the whole website are worked out from this, so they update every January.' })}`)}

      ${card('Contact details', `
        <div class="grid-2">
          ${text({ label: 'Phone number', path: 'contact.phone', v: m.contact.phone, ph: '+2347025723662', hint: 'With the country code and no spaces. Used for the call and WhatsApp links.' })}
          ${text({ label: 'Phone number as shown', path: 'contact.phoneLabel', v: m.contact.phoneLabel, ph: '+234 702 572 3662' })}
        </div>
        ${text({ label: 'Email address', path: 'contact.email', v: m.contact.email, type: 'email' })}
        ${text({ label: 'Location', path: 'contact.location', v: m.contact.location })}
        <div class="grid-2">
          ${text({ label: 'Active hours (yellow part)', path: 'contact.hoursHighlight', v: m.contact.hoursHighlight })}
          ${text({ label: 'Active hours (rest)', path: 'contact.hours', v: m.contact.hours })}
        </div>`)}

      <div class="section-head">
        <h2>Social links <small>${m.socials.length}</small></h2>
        ${addBtn('socials', 'social', 'Add social link')}
      </div>
      <p class="intro">These show in the contact section and in the hero menu, in this order. Remove a row to hide that link everywhere.</p>
      ${m.socials.length ? `<div class="stack">${m.socials.map(social).join('')}</div>` : '<div class="empty"><h3>No social links</h3><p>Press “Add social link” above to add one.</p></div>'}`;
  };

  bindForm(box, {
    draft: () => model,
    changed: () => shell.setDirty(true),
    redraw: () => {
      const y = scrollY;
      draw();
      if (fresh) {
        fresh = false;
        const r = box.querySelector('.stack > .row:last-child');
        r?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      } else scrollTo(0, y);
    },
    templates: { social: blankSocial },
    open: new Set(),
    after: act => { if (act === 'add') fresh = true; }
  });

  shell.onSave(async () => {
    const t = v => String(v ?? '').trim();
    const need = (v, what) => { if (!t(v)) throw new Error(`${what} cannot be empty.`); };
    need(model.brand.title, 'The website title');
    need(model.hero.name, 'The hero name line');
    need(model.contact.phone, 'The phone number');
    need(model.contact.email, 'The email address');
    if (!/^\S+@\S+\.\S+$/.test(t(model.contact.email))) throw new Error('That email address does not look right.');
    if (t(model.contact.phone).replace(/\D/g, '').length < 7) throw new Error('That phone number looks too short.');
    const since = Number(model.since);
    if (!(since >= 1990 && since <= new Date().getFullYear())) throw new Error('Enter the year you started as four digits, for example 2022.');

    const clean = {
      brand: { logo: t(model.brand.logo), favicon: t(model.brand.favicon), title: t(model.brand.title), description: t(model.brand.description), footer: t(model.brand.footer) },
      hero: {
        photo: t(model.hero.photo), name: t(model.hero.name), headline: t(model.hero.headline), bio: t(model.hero.bio),
        primary: t(model.hero.primary), secondary: t(model.hero.secondary), tags: model.hero.tags
      },
      about: { headline: t(model.about.headline) },
      contact: {
        phone: t(model.contact.phone), phoneLabel: t(model.contact.phoneLabel), email: t(model.contact.email),
        location: t(model.contact.location), hoursHighlight: t(model.contact.hoursHighlight), hours: t(model.contact.hours)
      },
      socials: model.socials
        .map(s => ({ network: s.network, url: t(s.url) }))
        .filter(s => s.url || s.network === 'whatsapp')
    };

    await shell.api.saveSection('site', clean);
    shell.content.site = structuredClone(clean);

    if (since !== Number(about().since)) {                      // the year lives in the About section
      const next = { ...about(), since };
      await shell.api.saveSection('about', next);
      shell.content.about = structuredClone(next);
    }
    Object.assign(model, load());
    draw();
  });

  draw();
}