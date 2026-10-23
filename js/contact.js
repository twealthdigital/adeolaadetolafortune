// Contact form (sends through Web3Forms).
export function initContact() {
  const form = document.getElementById('contact-form');
  const note = document.getElementById('contact-note');
  if (!form || !note) return;

  const say = (text, type) => { note.textContent = text; note.className = 'contact__note ' + (type || ''); };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();

    if (!name || !String(data.get('email') || '').trim() || !String(data.get('message') || '').trim()) {
      return say('Please fill in your name, email and message.', 'is-error');
    }

    const btn = form.querySelector('button[type="submit"]');
    const old = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = 'Sending...';

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: data
      });
      const json = await res.json();
      if (json.success) {
        say(`Thanks ${name.split(' ')[0]}! Your message has been sent.`, 'is-success');
        form.reset();
      } else {
        say('Something went wrong. Please try again or email me directly.', 'is-error');
      }
    } catch {
      say('Network error. Please email me directly.', 'is-error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = old;
    }
  });
}