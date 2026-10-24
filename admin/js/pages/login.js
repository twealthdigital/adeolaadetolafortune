// Admin login. Three screens:
//  1. Setup (first time)  : email + password + a 6-digit code you create
//  2. Quick login (daily) : email (autofilled) -> Continue -> your 6-digit code
//  3. Full login          : email + password + code (new device, or after 5 wrong codes in a row)
import { api } from '../api.js';
import { esc, confirmBox } from '../ui.js';
import { withLoader } from '../loader.js';
import { codeBoxes } from '../otp.js';

const LOAD_MS = 800;                     // how long the loading screen shows (same one the website has)
const DEVICE_KEY = 'portfolio.device';   // remembers this device's email, and whether quick login is locked

const device = {
  get() { try { return JSON.parse(localStorage.getItem(DEVICE_KEY)) || {}; } catch { return {}; } },
  set(patch) { try { localStorage.setItem(DEVICE_KEY, JSON.stringify({ ...device.get(), ...patch })); } catch { /* storage blocked */ } },
  clear() { try { localStorage.removeItem(DEVICE_KEY); } catch { /* ignore */ } }
};

export async function renderLogin(app, { message = '', onSuccess }) {
  let setup = true;
  try { setup = (await api.authStatus()).setup; } catch { /* the app shows its own "can't reach the backend" screen */ }

  const $ = sel => app.querySelector(sel);
  const local = () => api.mode === 'local';
  const showErr = text => { $('.login__err').textContent = text; };
  const note = text => (text ? `<p class="login__msg">${esc(text)}</p>` : '');

  const shell = ({ title, text, extra = '', body }) => `
    <main class="login">
      <form class="login__card" novalidate>
        <img class="login__logo" src="/assets/images/logo-if.webp" alt="" width="52" height="52">
        <h1>${title}</h1>
        <p>${text}</p>
        ${extra}
        ${body}
        <a class="login__back" href="/">Back to website</a>
      </form>
    </main>`;

  // Success: remember this device, then show the loading screen while the dashboard loads
  const enter = email => {
    device.set({ email, locked: false });
    return withLoader(() => onSuccess(), LOAD_MS);
  };

  // ---------- 1. Setup ----------
  function setupScreen() {
    app.innerHTML = shell({
      title: 'Set up your admin',
      text: 'Create your login once. After that you only need your email and your 6-digit code.',
      extra: note(message) + (local() ? note('Local mode: this login is saved in this browser only. Real security comes with the backend.') : ''),
      body: `
        <label class="f"><span class="f__label">Email</span>
          <input type="email" name="email" autocomplete="username" required></label>
        <label class="f"><span class="f__label">Password</span>
          <input type="password" name="password" autocomplete="new-password" required>
          <span class="f__hint">At least 8 characters. You need it if you are ever locked out.</span></label>
        <div class="f" role="group" aria-labelledby="code-label">
          <span class="f__label" id="code-label">Your 6-digit code</span>
          <div data-code></div>
          <span class="f__hint">You will type this code to log in each time. Remember it.</span></div>
        <p class="login__err" role="alert"></p>
        <button class="btn btn--primary btn--block" type="submit">Create my admin</button>`
    });
    const email = $('[name="email"]');
    const password = $('[name="password"]');
    const btn = $('button[type="submit"]');
    const code = codeBoxes($('[data-code]'), { masked: false });
    email.focus();

    $('form').addEventListener('submit', async e => {
      e.preventDefault();
      showErr('');
      if (!email.value.trim() || !email.checkValidity()) return showErr('Enter a valid email address.');
      if (password.value.length < 8) return showErr('Use a password of at least 8 characters.');
      if (code.value.length !== 6) return showErr('Your code must be 6 digits.');
      btn.disabled = true;
      btn.textContent = 'Setting up...';
      try {
        await api.signup(email.value.trim(), password.value, code.value);
      } catch (ex) {
        btn.disabled = false;
        btn.textContent = 'Create my admin';
        return showErr(ex.message);
      }
      enter(email.value.trim().toLowerCase());
    });
  }

  // ---------- 2a. Quick login: email ----------
  function emailScreen(prefill) {
    app.innerHTML = shell({
      title: 'Welcome back',
      text: 'Continue, then enter your 6-digit code.',
      extra: note(message),
      body: `
        <label class="f"><span class="f__label">Email</span>
          <input type="email" name="email" autocomplete="username" value="${esc(prefill)}" required></label>
        <p class="login__err" role="alert"></p>
        <button class="btn btn--primary btn--block" type="submit">Continue</button>
        <button class="login__alt" type="button" data-full>Log in with password instead</button>`
    });
    const email = $('[name="email"]');
    const btn = $('button[type="submit"]');
    (prefill ? btn : email).focus();           // email is already filled in: Enter or a tap on Continue

    $('[data-full]').addEventListener('click', () => fullScreen(email.value.trim() || prefill));
    $('form').addEventListener('submit', async e => {
      e.preventDefault();
      showErr('');
      if (!email.value.trim() || !email.checkValidity()) return showErr('Enter your email address.');
      btn.disabled = true;
      await withLoader(() => {}, LOAD_MS);
      codeScreen(email.value.trim());
    });
  }

  // ---------- 2b. Quick login: the 6-digit code ----------
  function codeScreen(email) {
    app.innerHTML = shell({
      title: 'Enter your code',
      text: `Type your 6-digit code for ${esc(email)}.`,
      body: `
        <div data-code></div>
        <p class="login__err" role="alert"></p>
        <button class="btn btn--primary btn--block" type="submit">Log in</button>
        <button class="login__alt" type="button" data-back>Use a different email</button>`
    });
    const form = $('form');
    const btn = $('button[type="submit"]');
    let busy = false;
    const code = codeBoxes($('[data-code]'), {
      onComplete: () => form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))   // log in on the 6th digit
    });
    code.focus();

    $('[data-back]').addEventListener('click', () => emailScreen(email));
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (busy) return;
      showErr('');
      if (code.value.length !== 6) return showErr('Enter all 6 digits.');
      busy = true;
      btn.disabled = true;
      try {
        await api.loginCode(email, code.value);
      } catch (ex) {
        busy = false;
        btn.disabled = false;
        if (ex.locked || ex.left === 0) {            // 5 wrong codes: back to email + password + code
          device.set({ locked: true });
          return fullScreen(email, 'Too many wrong codes. Log in with your email, password and code.');
        }
        code.error();
        code.clear();
        return showErr(ex.left != null ? `Wrong code. ${ex.left} ${ex.left === 1 ? 'try' : 'tries'} left.` : ex.message);
      }
      enter(email);
    });
  }

  // ---------- 3. Full login ----------
  function fullScreen(prefill = '', text = message) {
    app.innerHTML = shell({
      title: 'Log in',
      text: 'Enter your email, password and 6-digit code.',
      extra: note(text),
      body: `
        <label class="f"><span class="f__label">Email</span>
          <input type="email" name="email" autocomplete="username" value="${esc(prefill)}" required></label>
        <label class="f"><span class="f__label">Password</span>
          <input type="password" name="password" autocomplete="current-password" required></label>
        <div class="f" role="group" aria-labelledby="code-label">
          <span class="f__label" id="code-label">6-digit code</span>
          <div data-code></div></div>
        <p class="login__err" role="alert"></p>
        <button class="btn btn--primary btn--block" type="submit">Log in</button>
        ${local() ? '<button class="login__alt" type="button" data-reset>Forgot everything? Reset login</button>' : ''}`
    });
    const email = $('[name="email"]');
    const password = $('[name="password"]');
    const btn = $('button[type="submit"]');
    const code = codeBoxes($('[data-code]'));
    (prefill ? password : email).focus();

    $('[data-reset]')?.addEventListener('click', async () => {
      const ok = await confirmBox(
        'Reset your admin login?',
        'This removes the email, password and code saved in this browser. Your website content is not touched. You will set up a new login.',
        'Reset login'
      );
      if (!ok) return;
      await api.resetLogin();
      device.clear();
      setupScreen();
    });

    $('form').addEventListener('submit', async e => {
      e.preventDefault();
      showErr('');
      if (!email.value.trim() || !password.value) return showErr('Enter your email and password.');
      if (code.value.length !== 6) return showErr('Enter all 6 digits of your code.');
      btn.disabled = true;
      btn.textContent = 'Logging in...';
      try {
        await api.login(email.value.trim(), password.value, code.value);
      } catch (ex) {
        btn.disabled = false;
        btn.textContent = 'Log in';
        code.clear(false);
        password.select();
        return showErr(ex.message);
      }
      enter(email.value.trim().toLowerCase());
    });
  }

  // ---------- which screen first? ----------
  const dev = device.get();
  if (!setup) setupScreen();
  else if (dev.email && !dev.locked) emailScreen(dev.email);
  else fullScreen(dev.email || '');
}