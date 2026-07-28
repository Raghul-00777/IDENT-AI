// Shared app shell for authenticated pages: sidebar, admin access guard, sign-out.
import { initShell } from './shell.js';
import { requireAdmin } from './admin-auth.js';
import { signOut, getCurrentUser } from './api.js';

export async function initAppShell(skipAuth = false, includeHome = true) {
  let guard = { user: { email: 'admin@ident.ai' }, profile: { full_name: 'Administrator' }, role: 'admin' };
  if (!skipAuth) {
    guard = await requireAdmin();
    if (!guard) throw new Error('redirecting');
  } else {
    const current = await getCurrentUser();
    if (current) guard = current;
  }
  const slot = document.getElementById('app-shell-slot');
  if (slot) {
    slot.outerHTML = renderShell(guard, includeHome);
  }
  initShell();
  const signOutBtn = document.getElementById('signout-btn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      await signOut();
    });
  }

  // Fetch backend health to detect if model/face detector are available
  try {
    const apiBase = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.trim().replace(/\/+$/, '') : '';
    const healthUrl = apiBase ? (apiBase.endsWith('/api') ? `${apiBase}/health` : `${apiBase}/api/health`) : '/api/health';
    const res = await fetch(healthUrl);
    const j = await res.json();
    if (j && j.data && (j.data.model_available === false || j.data.face_detector_available === false)) {
      const banner = document.createElement('div');
      banner.className = 'model-warning';
      banner.style.cssText = 'background:#fffbeb;border:1px solid #f1c40f;padding:10px 14px;margin:8px;border-radius:6px;color:#6b4f00;font-weight:600;text-align:center;';
      banner.innerText = 'Running in fallback mode: native TensorFlow models unavailable. Detection uses heuristics only.';
      const main = document.querySelector('.main-content') || document.getElementById('main-content');
      if (main) main.prepend(banner);
    }
  } catch (e) {
    // ignore health check errors
  }

  return guard;
}

function renderShell(guard) {
  const email = guard.user?.email || '';
  const name = guard.profile?.full_name || email.split('@')[0];
  const role = guard.profile?.role || 'user';
  return `
  <div class="app-layout">
    <button class="sidebar-toggle" type="button" aria-label="Open navigation">☰</button>
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo"><span class="logo-mark" style="width:28px;height:28px;border-radius:7px;background:linear-gradient(135deg,var(--primary),var(--secondary));display:flex;align-items:center;justify-content:center;color:#001018;font-weight:900;font-size:13px;">I</span> IDENT AI</div>
      <nav class="sidebar-nav">
        <a href="/dashboard.html"><span class="icon">▦</span> Dashboard</a>
        <a href="/upload.html"><span class="icon">⚡</span> Detection</a>
        <a href="/history.html"><span class="icon">≡</span> History</a>
        <a href="/admin.html"><span class="icon">⚙</span> Admin Panel</a>
        <a href="/index.html"><span class="icon">⌂</span> Home</a>
      </nav>
      <div class="sidebar-footer">
        <div style="padding:8px 12px;font-size:12px;color:var(--muted);">
          <div style="color:var(--text);font-weight:600;margin-bottom:2px;">${escapeHtml(name)}</div>
          <div style="font-size:11px;">${escapeHtml(email)}</div>
          <div style="margin-top:6px;"><span class="badge ${role === 'admin' ? 'admin' : 'user'}">${role}</span></div>
        </div>
        <button id="signout-btn" class="btn btn-ghost w-full mt-16" style="margin-top:12px;">Sign Out</button>
      </div>
    </aside>
    <main class="main-content" id="main-content"></main>
  </div>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
