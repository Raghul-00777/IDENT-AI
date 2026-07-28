// Toast notifications + loading overlay
export function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '!' : 'i';
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-msg">${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

function createToastContainer() {
  const c = document.createElement('div');
  c.id = 'toast-container';
  document.body.appendChild(c);
  return c;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

export function showLoading(message = 'Processing...') {
  let overlay = document.getElementById('loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-card">
        <div class="loading-ring"><div></div><div></div><div></div><div></div></div>
        <p class="loading-text" id="loading-text">Processing...</p>
      </div>`;
    document.body.appendChild(overlay);
  }
  document.getElementById('loading-text').textContent = message;
  overlay.classList.add('show');
}

export function updateLoading(message, progress) {
  const el = document.getElementById('loading-text');
  if (el) el.textContent = progress != null ? `${message} (${progress}%)` : message;
}

export function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.remove('show');
}
