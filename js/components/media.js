// Shared file/media display for the whole site.
// Give it ANY file path or link and it picks the right display by itself.
const KINDS = {
  image: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg', 'bmp'],
  video: ['mp4', 'webm', 'mov', 'm4v', 'ogv'],
  audio: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'],
  pdf: ['pdf']
};

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const extOf = src => {
  const e = (String(src).split(/[?#]/)[0].split('.').pop() || '').toLowerCase();
  return /^[a-z0-9]{1,5}$/.test(e) ? e : '';
};

const embedOf = src => {
  let m = String(src).match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (m) return `https://www.youtube-nocookie.com/embed/${m[1]}`;
  m = String(src).match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return `https://player.vimeo.com/video/${m[1]}`;
  return '';
};

const isExternal = src => /^https?:\/\//i.test(src) && !String(src).startsWith(location.origin);

export const kindOf = src => {
  if (embedOf(src)) return 'embed';
  const e = extOf(src);
  for (const k in KINDS) if (KINDS[k].includes(e)) return k;
  return 'file';
};

const badgeOf = src => extOf(src).toUpperCase() || (isExternal(src) ? 'LINK' : 'FILE');

// Documents download; everything else opens in a new tab
const attrsOf = src => (kindOf(src) === 'file' && !isExternal(src) && extOf(src)) ? 'download' : 'target="_blank" rel="noopener"';

// Fills a thumbnail box (the box must be position: relative, like .sd__thumb)
export function mediaInner(src, title = '', poster = '') {
  if (!src) return '';
  const t = esc(title), s = esc(src), kind = kindOf(src);

  if (kind === 'image') return `<a class="md__fill" href="${s}" target="_blank" rel="noopener" aria-label="Open ${t}"><img src="${s}" alt="${t}" loading="lazy" draggable="false"></a>`;
  if (kind === 'video') return `<video class="md__fill md__video" src="${s}" ${poster ? `poster="${esc(poster)}"` : ''} controls playsinline preload="metadata" aria-label="${t}"></video>`;
  if (kind === 'audio') return `<div class="md__fill md__audio"><span class="md__badge">${badgeOf(src)}</span><audio src="${s}" controls preload="none" aria-label="${t}"></audio></div>`;
  if (kind === 'embed') return `<iframe class="md__fill" src="${esc(embedOf(src))}" title="${t}" loading="lazy" allow="fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;

  // pdf + documents + anything else: a file tile
  const cta = attrsOf(src) === 'download' ? 'Download' : 'Open';
  return `<a class="md__fill md__file" href="${s}" ${attrsOf(src)} aria-label="${cta} ${t}">
    ${poster ? `<img class="md__poster" src="${esc(poster)}" alt="" loading="lazy" draggable="false">` : ''}
    <span class="md__badge">${esc(badgeOf(src))}</span>
    <span class="md__cta">${cta} file</span>
  </a>`;
}

// Small download chips: attachmentsHTML([{ label: 'Case study', src: '/assets/documents/case-study.pdf' }])
export function attachmentsHTML(files) {
  if (!files || !files.length) return '';
  return `<ul class="md__files">${files.map(f => `
    <li><a class="md__chip" href="${esc(f.src)}" ${attrsOf(f.src)}><b>${esc(badgeOf(f.src))}</b>${esc(f.label || 'File')}</a></li>`).join('')}</ul>`;
}