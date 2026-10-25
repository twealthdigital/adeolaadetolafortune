const K = { content: 'portfolio.content', settings: 'portfolio.settings', session: 'portfolio.session', auth: 'portfolio.auth' };
const MAX_FILE_MB = 3;
const MAX_MISSES = 5;   // wrong 6-digit codes in a row before the full login (email + password + code) is needed again
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const read = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { throw new Error('Browser storage is full. Remove some uploaded files, or wait for Cloudinary to be connected.'); }
}
const fail = (message, status, extra) => Object.assign(new Error(message), { status }, extra);
const norm = email => String(email || '').trim().toLowerCase();

// ---------- passwords and codes are never saved as plain text ----------
const enc = new TextEncoder();
const toB64 = bytes => btoa(String.fromCharCode(...bytes));
const fromB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

// Plain http pages (for example testing on a phone over Wi-Fi) have no crypto.subtle, so this simpler salted hash is used there.
function weakHash(secret, salt) {
  const text = toB64(salt) + ':' + secret;
  let out = '';
  for (let lane = 0; lane < 4; lane++) {
    let h = (2166136261 ^ (lane * 16777619)) >>> 0;
    for (let round = 0; round < 3000; round++) for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0;
    out += h.toString(16).padStart(8, '0');
  }
  return out;
}
async function derive(secret, salt) {
  if (!crypto.subtle) return weakHash(secret, salt);
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
  return toB64(new Uint8Array(bits));
}
async function protect(secret) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { salt: toB64(salt), hash: await derive(secret, salt) };
}
const matches = async (secret, rec) => !!rec && (await derive(String(secret), fromB64(rec.salt))) === rec.hash;

async function seed() {
  try {
    const r = await fetch('/content/content.json');
    if (r.ok) return await r.json();
  } catch { /* fall through */ }
  return { experience: [], services: [], about: {} };
}

async function shrink(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / bmp.width);
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise(res => c.toBlob(res, 'image/webp', 0.72));
  return blob && blob.size < file.size ? blob : file;
}

export const localApi = {
  // ---------- login ----------
  async me() {
    if (!localStorage.getItem(K.session)) throw fail('Not logged in.', 401);
    return { email: (read(K.auth) || {}).email || '' };
  },
  async authStatus() {
    return { setup: !!read(K.auth) };
  },
  async signup(email, password, code) {
    if (read(K.auth)) throw fail('An admin already exists. Log in instead.', 409);
    email = norm(email);
    if (!EMAIL.test(email)) throw fail('Enter a valid email address.', 400);
    if (String(password).length < 8) throw fail('Use a password of at least 8 characters.', 400);
    if (!/^\d{6}$/.test(code)) throw fail('Your code must be exactly 6 digits.', 400);
    write(K.auth, { email, pass: await protect(password), code: await protect(code), misses: 0 });
    localStorage.setItem(K.session, '1');
    return { email };
  },
  async loginCode(email, code) {                     // quick login: email + 6-digit code
    const a = read(K.auth);
    if (!a) throw fail('No admin is set up yet.', 404);
    if ((a.misses || 0) >= MAX_MISSES) throw fail('Too many wrong codes.', 423, { left: 0, locked: true });
    if (norm(email) !== a.email) throw fail('Wrong email or code.', 401);
    if (!(await matches(code, a.code))) {
      a.misses = (a.misses || 0) + 1;
      write(K.auth, a);
      const left = MAX_MISSES - a.misses;
      throw fail('Wrong code.', 401, { left, locked: left === 0 });
    }
    a.misses = 0;
    write(K.auth, a);
    localStorage.setItem(K.session, '1');
    return { email: a.email };
  },
  async login(email, password, code) {               // full login: email + password + code (also unlocks quick login again)
    const a = read(K.auth);
    if (!a) throw fail('No admin is set up yet.', 404);
    const ok = norm(email) === a.email && await matches(password, a.pass) && await matches(code, a.code);
    if (!ok) throw fail('Wrong email, password or code.', 401);
    a.misses = 0;
    write(K.auth, a);
    localStorage.setItem(K.session, '1');
    return { email: a.email };
  },
  async resetLogin() {
    localStorage.removeItem(K.auth);
    localStorage.removeItem(K.session);
    return {};
  },
  async logout() {
    localStorage.removeItem(K.session);
    return {};
  },

  // ---------- content ----------
  async getContent() {
    return read(K.content) || await seed();
  },
  async saveSection(name, data) {
    const all = read(K.content) || await seed();
    all[name] = data;
    write(K.content, all);
    return all[name];
  },
  async getSettings() {
    const s = read(K.settings) || {};
    return { hasKey: !!s.web3formsKey, keyEnd: (s.web3formsKey || '').slice(-4), subject: s.subject || 'New message from my portfolio' };
  },
  async saveSettings(body) {
    const s = { ...(read(K.settings) || {}), ...body };
    write(K.settings, s);
    return this.getSettings();
  },
  upload(file, onProgress) {
    return new Promise(async (resolve, reject) => {
      try {
        if (file.size > MAX_FILE_MB * 1024 * 1024 * 4) throw new Error('That file is too big for local mode. Use a link for now, Cloudinary will handle big files later.');
        const small = await shrink(file);
        if (small.size > MAX_FILE_MB * 1024 * 1024) throw new Error(`Local mode keeps files under ${MAX_FILE_MB}MB. Paste a link instead, Cloudinary will handle big files later.`);
        const reader = new FileReader();
        reader.onprogress = e => { if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100)); };
        reader.onerror = () => reject(new Error('Could not read that file.'));
        reader.onload = () => resolve({ url: reader.result });
        reader.readAsDataURL(small);
      } catch (err) { reject(err); }
    });
  }
};