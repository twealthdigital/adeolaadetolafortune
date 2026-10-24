// The same loading screen the website shows (pulsing "!F" and a sliding bar).
// withLoader(task, minMs): shows it, waits for the task AND the minimum time, then fades out.
const wait = ms => new Promise(r => setTimeout(r, ms));

export async function withLoader(task = () => {}, minMs = 800) {
  const el = document.createElement('div');
  el.className = 'loader';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-label', 'Loading');
  el.innerHTML = '<div class="loader__mark"><span>!</span>F</div><div class="loader__bar"></div>';
  document.body.append(el);
  try {
    const [value] = await Promise.all([Promise.resolve().then(task), wait(minMs)]);
    return value;
  } finally {
    el.classList.add('is-done');
    setTimeout(() => el.remove(), 450);
  }
}