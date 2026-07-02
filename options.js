const keyInput  = document.getElementById('apiKey');
const saveBtn   = document.getElementById('saveBtn');
const clearBtn  = document.getElementById('clearBtn');
const toggleBtn = document.getElementById('toggleKey');
const eyeShow   = document.getElementById('eyeShow');
const eyeHide   = document.getElementById('eyeHide');
const statusEl  = document.getElementById('status');

chrome.storage.local.get('anthropicApiKey', ({ anthropicApiKey }) => {
  if (anthropicApiKey) keyInput.value = anthropicApiKey;
});

toggleBtn.addEventListener('click', () => {
  const showing = keyInput.type === 'text';
  keyInput.type = showing ? 'password' : 'text';
  eyeShow.hidden = !showing;
  eyeHide.hidden = showing;
});

saveBtn.addEventListener('click', () => {
  const key = keyInput.value.trim();
  if (!key) {
    showStatus('Please enter an API key.', 'error');
    return;
  }
  if (!key.startsWith('sk-ant-')) {
    showStatus('Key should start with sk-ant-', 'error');
    return;
  }
  chrome.storage.local.set({ anthropicApiKey: key }, () => {
    showStatus('Saved!', 'success');
  });
});

clearBtn.addEventListener('click', () => {
  chrome.storage.local.remove('anthropicApiKey', () => {
    keyInput.value = '';
    showStatus('Key removed.', 'success');
  });
});

function showStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = 'status ' + type;
  clearTimeout(statusEl._timer);
  statusEl._timer = setTimeout(() => {
    statusEl.textContent = '';
    statusEl.className = 'status';
  }, 3000);
}
