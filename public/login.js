const form = document.getElementById('loginForm');
const message = document.getElementById('message');

async function checkSession() {
  const response = await fetch('/api/me');
  if (response.ok) {
    window.location.href = '/games.html';
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = '';

  const formData = new FormData(form);
  const payload = {
    email: String(formData.get('email') || '').trim(),
    password: String(formData.get('password') || '')
  };

  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const data = await response.json();
    message.textContent = data.error || 'Login fehlgeschlagen.';
    return;
  }

  window.location.href = '/games.html';
});

checkSession();
