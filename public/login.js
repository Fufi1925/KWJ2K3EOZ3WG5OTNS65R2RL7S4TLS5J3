const form = document.getElementById('authForm');
const message = document.getElementById('message');

async function checkSession() {
  const response = await fetch('/api/me');
  if (response.ok) window.location.href = '/choose.html';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = '';
  const formData = new FormData(form);
  const payload = {
    username: String(formData.get('username') || '').trim(),
    password: String(formData.get('password') || '')
  };

  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const data = await response.json();
    message.textContent = data.error || 'Anmeldung fehlgeschlagen.';
    return;
  }

  window.location.href = '/choose.html';
});

checkSession();
