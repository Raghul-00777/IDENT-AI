// Shared shell: animated background, cursor glow, particles, navbar/sidebar behavior.
// Loaded on every page. Page-specific scripts import helpers from here as needed.

export function initShell() {
  ensureBackground();
  ensureCursorGlow();
  initNavbarScroll();
  initNavToggle();
  highlightActiveNav();
}

function ensureBackground() {
  if (document.querySelector('.cyber-bg')) return;
  const bg = document.createElement('div'); bg.className = 'cyber-bg';
  const grid = document.createElement('div'); grid.className = 'cyber-grid';
  const particles = document.createElement('div'); particles.className = 'particles';
  for (let i = 0; i < 24; i++) {
    const p = document.createElement('div'); p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDuration = (10 + Math.random() * 20) + 's';
    p.style.animationDelay = -Math.random() * 20 + 's';
    p.style.opacity = (0.2 + Math.random() * 0.5).toString();
    particles.appendChild(p);
  }
  document.body.prepend(particles, grid, bg);
}

function ensureCursorGlow() {
  if (document.querySelector('.cursor-glow')) return;
  const glow = document.createElement('div'); glow.className = 'cursor-glow';
  document.body.appendChild(glow);
  document.addEventListener('mousemove', (e) => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
  });
}

function initNavbarScroll() {
  const nav = document.querySelector('.navbar');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  });
}

function initNavToggle() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
  }
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (sidebarToggle && sidebar) {
    let backdrop = document.querySelector('.sidebar-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      document.body.appendChild(backdrop);
      backdrop.addEventListener('click', () => {
        sidebar.classList.remove('open');
        document.body.classList.remove('sidebar-active');
      });
    }
    sidebarToggle.addEventListener('click', () => {
      const open = sidebar.classList.toggle('open');
      document.body.classList.toggle('sidebar-active', open);
    });
  }
}

function highlightActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .sidebar-nav a').forEach((a) => {
    const href = a.getAttribute('href');
    if (href && href.endsWith(path)) a.classList.add('active');
  });
}
