// Shared auth-shell helper: ensures background + redirects if already logged in.
import { initShell } from './shell.js';
import { getCurrentUser } from './api.js';

export async function initAuthShell() {
  initShell();
  // If already logged in, go to dashboard
  const cur = await getCurrentUser();
  if (cur) {
    window.location.href = '/dashboard.html';
    return false;
  }
  return true;
}
