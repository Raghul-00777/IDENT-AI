import { getCurrentUser } from './api.js';

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (user) return user;
  window.location.href = '/login.html';
  return null;
}
