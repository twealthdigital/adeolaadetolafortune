// LOCAL MODE: lets the whole admin work with no backend (Live Server, file preview, etc).
// Everything is saved in this browser's localStorage. It has the same methods as the real api,
// so when Mongo and Cloudinary are ready only the server side needs to be built.
export const LOCAL_LOGIN = { email: 'admin@local.dev', password: 'admin123' };

const K = { content: 'portfolio.content', settings: 'portfolio.settings', session: 'portfolio.session' };
const MAX_FILE_MB = 3;

const read = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { throw new Error('Browser storage is full. Remove some uploaded files, or wait for Cloudinary to be connected.'); }
}
const fail = (message, status) => Object.assign(new Error(message), { status });

async function seed() {
  try {
    const r = await fetch('/content/content.json');
    if (r.ok) return await r.json();
  } catch { /* fall through */ }
  return { experience: [], services: [], about: {} };
}

// Shrinks big pictures so they fit in browser storage. Other files are stored as they are.
async function shrink(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / bmp.width);
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise(res => c.toBlob(res, 'image/webp', 0.85));
  return blob && blob.size < file.size ? blob : file;
}

export const localApi = {
  async me() {
    if (!localStorage.getItem(K.session)) throw fail('Not logged in.', 401);
    return { email: LOCAL_LOGIN.email };
  },
  async login(email, password) {
    if (email !== LOCAL_LOGIN.email || password !== LOCAL_LOGIN.password) throw fail('Wrong email or password.', 401);
    localStorage.setItem(K.session, '1');
    return { email };
  },
  async logout() {
    localStorage.removeItem(K.session);
    return {};
  },
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
        if (file.size > MAX_FILE_MB * 1024 * 1024 * 4) throw new Error(`That file is too big for local mode. Use a link for now, Cloudinary will handle big files later.`);
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
