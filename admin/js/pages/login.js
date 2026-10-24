// Login screen.
import { api } from '../api.js';
import { esc } from '../ui.js';

export function renderLogin(app, { message = '', onSuccess }) {
  app.innerHTML = `
    <main class="login">
      <form class="login__card" novalidate>
        <img class="login__logo" src="/assets/images/logo-if.webp" alt="" width="52" height="52">
        <h1>Admin login</h1>
        <p>Sign in to update your portfolio.</p>
        ${message ? `<p class="login__msg">${esc(message)}</p>` : ''}
        <label class="f"><span class="f__label">Email</span>
          <input type="email" name="email" autocomplete="username" required></label>
        <label class="f"><span class="f__label">Password</span>
          <input type="password" name="password" autocomplete="current-password" required></label>
        <p class="login__err" role="alert"></p>
        <button class="btn btn--primary btn--block" type="submit">Log in</button>
        <a class="login__back" href="/">Back to website</a>
      </form>
    </main>`;

  const form = app.querySelector('form');
  const err = app.querySelector('.login__err');
  const btn = form.querySelector('button');
  const email = form.querySelector('[name="email"]');
  const password = form.querySelector('[name="password"]');
  email.focus();

  form.addEventListener('submit', async e => {
    e.preventDefault();
    err.textContent = '';
    if (!email.value.trim() || !password.value) {
      err.textContent = 'Enter your email and password.';
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Logging in...';
    try {
      await api.login(email.value.trim(), password.value);
      onSuccess();
    } catch (ex) {
      err.textContent = ex.message;
      btn.disabled = false;
      btn.textContent = 'Log in';
      password.select();
    }
  });
}