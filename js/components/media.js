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
  const dm = /^data:[^/;,]+\/([a-z0-9]+)/i.exec(String(src));
  if (dm) return dm[1].toLowerCase();
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
export function mediaInner(src, title = '', poster = '', link = true) {
  if (!src) return '';
  const t = esc(title), s = esc(src), kind = kindOf(src);

  if (kind === 'image') return link
    ? `<a class="md__fill" href="${s}" target="_blank" rel="noopener" aria-label="Open ${t}"><img src="${s}" alt="${t}" loading="lazy" draggable="false"></a>`
    : `<img class="md__fill" src="${s}" alt="${t}" loading="lazy" draggable="false">`;
  if (kind === 'video') return `<video class="md__fill md__video" src="${s}" ${poster ? `poster="${esc(poster)}"` : ''} controls playsinline preload="metadata" aria-label="${t}"></video>`;
  if (kind === 'audio') return `<div class="md__fill md__audio"><span class="md__badge">${badgeOf(src)}</span><audio src="${s}" controls preload="none" aria-label="${t}"></audio></div>`;
  if (kind === 'embed') return videoFacade(src, poster, title);

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


/* ---------- Videos: a thumbnail with a play button. The real player only loads when pressed. ---------- */
const ytThumb = src => { const m = String(src).match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/); return m ? `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg` : ''; };

export function videoFacade(src, thumb = '', title = '') {
  if (!embedOf(src)) return '';
  const pic = thumb || ytThumb(src);
  return `<button class="vf" type="button" data-video="${esc(src)}" data-title="${esc(title)}" aria-label="Play ${esc(title || 'video')}">
    ${pic ? `<img class="vf__img" src="${esc(pic)}" alt="" loading="lazy" decoding="async" draggable="false">` : ''}
    <span class="vf__play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
  </button>`;
}

const pauseFrame = f => {
  try {
    const yt = f.src.includes('youtube');
    f.contentWindow.postMessage(yt ? '{"event":"command","func":"pauseVideo","args":[]}' : '{"method":"pause"}', '*');
  } catch { /* the player is not ready yet, nothing to pause */ }
};
export const pauseVideos = (except = null) => document.querySelectorAll('iframe.vf__frame').forEach(f => { if (f !== except) pauseFrame(f); });

let videosReady = false;
function initVideos() {
  if (videosReady || typeof document === 'undefined') return;
  videosReady = true;

  // Scroll past a playing video (or close the panel) and it pauses; it stays paused until pressed again
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver(list => list.forEach(en => { if (en.intersectionRatio < 0.25) pauseFrame(en.target); }), { threshold: [0, 0.25] })
    : null;

  // Warm up the connection the first time a finger or mouse gets near, so pressing play starts quicker
  let warmed = false;
  const warm = () => {
    if (warmed) return;
    warmed = true;
    ['https://www.youtube-nocookie.com', 'https://i.ytimg.com', 'https://player.vimeo.com'].forEach(href => {
      const l = document.createElement('link');
      l.rel = 'preconnect'; l.href = href;
      document.head.append(l);
    });
  };
  document.addEventListener('pointerover', e => { if (e.target.closest?.('.vf')) warm(); }, { passive: true });
  document.addEventListener('touchstart', e => { if (e.target.closest?.('.vf')) warm(); }, { passive: true });

  document.addEventListener('click', e => {
    const btn = e.target.closest('.vf');
    if (!btn || btn.classList.contains('is-loading')) return;
    const base = embedOf(btn.dataset.video);
    if (!base) return;
    const yt = base.includes('youtube');
    const q = yt
      ? `autoplay=1&rel=0&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`
      : 'autoplay=1&playsinline=1';
    const f = document.createElement('iframe');
    f.className = 'vf__frame';
    f.src = `${base}?${q}`;
    f.title = btn.dataset.title || 'Video';
    f.allow = 'autoplay; fullscreen; picture-in-picture';
    f.allowFullscreen = true;
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    btn.classList.add('is-loading');                  // the thumbnail stays on screen until the player is ready
    f.addEventListener('load', () => btn.remove());
    pauseVideos();                                    // only one video plays at a time
    btn.parentElement.append(f);
    io?.observe(f);
  });
}
initVideos();