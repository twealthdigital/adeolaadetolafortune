import { localApi } from './local-api.js';

// Talks to the backend. Every call returns the JSON answer, or throws an Error with a readable message.
let onUnauthorized = () => {};
export const setUnauthorizedHandler = fn => { onUnauthorized = fn; };

async function request(method, url, body) {
  let res;
  try {
    res = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?');
  }

  let data = null;
  try { data = await res.json(); } catch { /* empty answer */ }

  if (!res.ok) {
    if (res.status === 401 && !/\/api\/admin\/(login|login\/code|signup|status|me)$/.test(url)) onUnauthorized();
    const err = new Error((data && data.error) || `Something went wrong (${res.status}).`);
    err.status = res.status;
    err.left = data && data.left;               // 6-digit code tries left (sent by the backend)
    err.locked = !!(data && data.locked);       // true after 5 wrong codes
    throw err;
  }
  return data;
}

const remote = {
  me: () => request('GET', '/api/admin/me'),
  authStatus: () => request('GET', '/api/admin/status'),
  signup: (email, password, code) => request('POST', '/api/admin/signup', { email, password, code }),
  loginCode: (email, code) => request('POST', '/api/admin/login/code', { email, code }),
  login: (email, password, code) => request('POST', '/api/admin/login', { email, password, code }),
  resetLogin: async () => { throw new Error('Reset is only for local mode.'); },
  logout: () => request('POST', '/api/admin/logout', {}),
  getContent: () => request('GET', '/api/admin/content'),
  saveSection: (name, data) => request('PUT', `/api/admin/content/${name}`, data),
  getSettings: () => request('GET', '/api/admin/settings'),
  saveSettings: data => request('PUT', '/api/admin/settings', data),

  // Uses XMLHttpRequest so big videos can show a progress percentage.
  upload(file, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/admin/upload');
      xhr.responseType = 'json';
      xhr.upload.onprogress = e => { if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100)); };
      xhr.onload = () => {
        const d = xhr.response;
        if (xhr.status >= 200 && xhr.status < 300 && d && d.url) return resolve(d);
        if (xhr.status === 401) onUnauthorized();
        reject(new Error((d && d.error) || `Upload failed (${xhr.status}).`));
      };
      xhr.onerror = () => reject(new Error('Upload failed. Is the backend running?'));
      const form = new FormData();
      form.append('file', file);
      xhr.send(form);
    });
  }
};



let local;
async function detect() {
  if (local !== undefined) return local;
  try {
    const res = await fetch('/api/admin/me', { headers: { Accept: 'application/json' } });
    local = res.status === 404 || res.status === 405;
  } catch { local = true; }
  return local;
}

export const api = {
  get mode() { return local ? 'local' : 'server'; },
  ...Object.fromEntries(Object.keys(remote).map(k => [k, async (...a) => ((await detect()) ? localApi : remote)[k](...a)]))
};