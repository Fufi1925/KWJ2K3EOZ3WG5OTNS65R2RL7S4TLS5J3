const form = document.getElementById('authForm');
const message = document.getElementById('message');
const submitBtn = document.getElementById('submitBtn');
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');

let mode = 'login';

function setMode(nextMode) {
  mode = nextMode;
  const isLogin = mode === 'login';
  loginTab.classList.toggle('active', isLogin);
  registerTab.classList.toggle('active', !isLogin);
  submitBtn.textContent = isLogin ? 'Einloggen' : 'Registrieren';
  message.textContent = '';
}

loginTab.addEventListener('click', () => setMode('login'));
registerTab.addEventListener('click', () => setMode('register'));

async function checkSession() {
  const response = await fetch('/api/me');
  if (response.ok) window.location.href = '/games.html';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = '';
  const formData = new FormData(form);
  const payload = {
    email: String(formData.get('email') || '').trim(),
    password: String(formData.get('password') || '')
  };

  const endpoint = mode === 'login' ? '/api/login' : '/api/register';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const data = await response.json();
    message.textContent = data.error || 'Aktion fehlgeschlagen.';
    return;
  }

  window.location.href = '/games.html';
});

checkSession();
