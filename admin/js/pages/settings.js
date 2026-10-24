// CONTACT FORM: paste the Web3Forms access key here instead of editing code.
// The key is kept on the server. It is never written into the website's HTML.
import { esc, icon } from '../ui.js';

export async function mount(box, shell) {
  box.innerHTML = '<p class="intro">Loading...</p>';

  let s;
  try {
    s = await shell.api.getSettings();
  } catch (err) {
    box.innerHTML = `<div class="empty"><h3>Could not load settings</h3><p>${esc(err.message)}</p></div>`;
    return;
  }

  const status = () => s.hasKey
    ? `<p class="pill pill--ok">${icon('check')} Connected <span>key ending ${esc(s.keyEnd || '')}</span></p>`
    : '<p class="pill pill--warn">Not connected. The contact form cannot send messages yet.</p>';

  const draw = () => {
    box.innerHTML = `
      <div class="card">
        <div class="card__head"><strong class="card__title">Connect your contact form</strong></div>
        <div class="card__body">
          <div id="key-status">${status()}</div>

          <ol class="steps">
            <li>Go to <a href="https://web3forms.com" target="_blank" rel="noopener">web3forms.com</a> and enter the email where you want to receive messages.</li>
            <li>They email you an <b>Access Key</b>. Copy it.</li>
            <li>Paste it below and press <b>Save changes</b>. That's all.</li>
          </ol>

          <label class="f"><span class="f__label">Web3Forms access key</span>
            <span class="pw">
              <input type="password" id="key" placeholder="${s.hasKey ? 'Leave empty to keep the current key' : 'Paste your access key'}" autocomplete="off" spellcheck="false">
              <button type="button" class="ib" id="peek" aria-label="Show or hide the key">${icon('eye')}</button>
            </span>
          </label>

          <label class="f"><span class="f__label">Email subject</span>
            <input type="text" id="subject" value="${esc(s.subject || '')}" autocomplete="off">
            <small class="f__hint">The subject line you will see on every message from the form.</small>
          </label>
        </div>
      </div>

      <div class="card card--plain">
        <div class="card__body">
          <p class="intro">Finished for today?</p>
          <button type="button" class="btn" id="out">${icon('logout')} Log out</button>
        </div>
      </div>`;

    const key = box.querySelector('#key');
    const subject = box.querySelector('#subject');
    key.addEventListener('input', () => shell.setDirty(true));
    subject.addEventListener('input', () => shell.setDirty(true));
    box.querySelector('#peek').addEventListener('click', () => { key.type = key.type === 'password' ? 'text' : 'password'; });
    box.querySelector('#out').addEventListener('click', shell.logout);
  };

  shell.onSave(async () => {
    const key = box.querySelector('#key').value.trim();
    const subject = box.querySelector('#subject').value.trim();
    if (key && key.length < 10) throw new Error('That key looks too short. Copy the whole Access Key from the Web3Forms email.');
    if (!s.hasKey && !key) throw new Error('Paste your access key first.');
    if (!subject) throw new Error('Add an email subject.');

    const body = { subject };
    if (key) body.web3formsKey = key;
    s = await shell.api.saveSettings(body);
    draw();
  });

  draw();
}