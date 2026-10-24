// Six separate boxes for a 6-digit code: typing, paste, backspace and arrow keys all work.
// masked = true shows dots instead of digits (for logging in). masked = false shows them (when creating a code).
export function codeBoxes(host, { masked = true, onComplete } = {}) {
  host.className = 'otp';
  host.innerHTML = Array.from({ length: 6 }, (_, i) =>
    `<input class="otp__d" type="text" inputmode="numeric" maxlength="1" autocomplete="off" autocapitalize="off" spellcheck="false" data-lpignore="true" data-1p-ignore aria-label="Digit ${i + 1} of 6">`
  ).join('');

  const boxes = [...host.querySelectorAll('input')];
  const digit = b => b.dataset.v || '';
  const value = () => boxes.map(digit).join('');
  const set = (b, d) => { b.dataset.v = d; b.value = d && masked ? '•' : d; };
  const go = i => { const b = boxes[Math.min(5, Math.max(0, i))]; b.focus(); b.select(); };
  const done = () => { if (value().length === 6) onComplete?.(value()); };

  const fill = digits => {                       // a whole code pasted or autofilled at once
    digits.slice(0, 6).split('').forEach((d, i) => set(boxes[i], d));
    host.classList.remove('is-error');
    go(digits.length >= 6 ? 5 : digits.length);
    done();
  };

  boxes.forEach((b, i) => {
    b.addEventListener('input', () => {
      if (b.value === '•') return;               // nothing new was typed
      const d = b.value.replace(/\D/g, '');
      if (d.length > 1) return fill(d);
      set(b, d);
      host.classList.remove('is-error');
      if (d && i < 5) go(i + 1);
      done();
    });
    b.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !digit(b) && i > 0) { e.preventDefault(); set(boxes[i - 1], ''); go(i - 1); }
      else if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); go(i - 1); }
      else if (e.key === 'ArrowRight' && i < 5) { e.preventDefault(); go(i + 1); }
    });
    b.addEventListener('paste', e => {
      const d = (e.clipboardData?.getData('text') || '').replace(/\D/g, '');
      if (d) { e.preventDefault(); fill(d); }
    });
    b.addEventListener('focus', () => b.select());
    b.addEventListener('click', () => b.select());
  });

  return {
    get value() { return value(); },
    focus() { const i = boxes.findIndex(b => !digit(b)); go(i === -1 ? 5 : i); },
    clear(focus = true) { boxes.forEach(b => set(b, '')); if (focus) go(0); },
    error() { host.classList.remove('is-error'); void host.offsetWidth; host.classList.add('is-error'); }
  };
}