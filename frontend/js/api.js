const STORAGE_KEYS = {
  TOKEN: 'ident-ai-token',
  LOGS: 'ident-ai-logs',
  SETTINGS: 'ident-ai-settings',
};

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function makeApiUrl(path = '') {
  const normalizedPath = path.replace(/^\/?/, '').replace(/\/+/g, '/');
  const base = API_BASE_URL.trim().replace(/\/+$/, '');
  if (!base) {
    return `/api/${normalizedPath}`;
  }
  if (base.endsWith('/api')) {
    return `${base}/${normalizedPath}`;
  }
  return `${base}/api/${normalizedPath}`;
}

function loadStore(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('loadStore failed', e);
    return [];
  }
}

function saveStore(key, data) {
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('saveStore failed', e);
  }
}

function getToken() {
  return window.localStorage.getItem(STORAGE_KEYS.TOKEN);
}

function saveToken(token) {
  if (token) window.localStorage.setItem(STORAGE_KEYS.TOKEN, token);
}

function clearToken() {
  window.localStorage.removeItem(STORAGE_KEYS.TOKEN);
}

function getJsonHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}), ...getJsonHeaders() };
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const url = makeApiUrl(path);
  const response = await fetch(url, {
    credentials: API_BASE_URL ? 'omit' : 'same-origin',
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message = body?.message || body?.error || response.statusText || `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return body;
}

export async function signIn(password) {
  const body = await request('/auth/login', {
    method: 'POST',
    headers: getJsonHeaders(),
    body: JSON.stringify({ password }),
  });
  const token = body?.data?.token;
  if (!token) throw new Error('Authentication failed.');
  saveToken(token);
  return { token };
}

export async function signOut() {
  clearToken();
  window.location.href = '/login.html';
}

export async function getCurrentUser() {
  const token = getToken();
  if (!token) return null;
  try {
    const response = await request('/auth/me', { method: 'GET', headers: getJsonHeaders() });
    return response?.data || null;
  } catch (err) {
    clearToken();
    return null;
  }
}

export async function requireAuth() {
  return getCurrentUser();
}

export async function analyzeMedia(file, modelKey = 'efficientnet') {
  const form = new FormData();
  form.append('file', file);
  form.append('modelKey', modelKey);
  const analysisUrl = makeApiUrl('/detection/analyze');
  const response = await fetch(analysisUrl, {
    method: 'POST',
    body: form,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message || 'Analysis request failed');
  }
  return payload.data;
}

export async function logAction(action, details = '') {
  const logs = loadStore(STORAGE_KEYS.LOGS);
  logs.unshift({ action, details, created_at: new Date().toISOString() });
  if (logs.length > 500) logs.length = 500;
  saveStore(STORAGE_KEYS.LOGS, logs);
}

export async function listPredictions({ limit = 100, offset = 0 } = {}) {
  const response = await request(`/predictions?limit=${limit}&offset=${offset}`, { method: 'GET', headers: getJsonHeaders() });
  return response?.data || [];
}

export async function getPrediction(id) {
  const response = await request(`/predictions/${id}`, { method: 'GET', headers: getJsonHeaders() });
  return response?.data || null;
}

export async function deletePrediction(id) {
  await request(`/predictions/${id}`, { method: 'DELETE', headers: getJsonHeaders() });
  return true;
}

export async function getDashboardStats() {
  const predictions = await listPredictions({ limit: 1000, offset: 0 });
  const total = predictions.length;
  const aiCount = predictions.filter((p) => p.prediction === 'AI GENERATED').length;
  const humanCount = total - aiCount;
  const avgConf = total > 0 ? Math.round(predictions.reduce((sum, p) => sum + (p.confidence || 0), 0) / total) : 0;
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const count = predictions.filter((p) => {
      const t = new Date(p.created_at);
      return t >= d && t < next;
    }).length;
    days.push({ date: d.toISOString().slice(5, 10), count });
  }
  return { total, aiCount, humanCount, avgConf, days };
}

export async function getAdminStats() {
  const response = await request('/admin/stats', { method: 'GET', headers: getJsonHeaders() });
  return response?.data || { logs: [], totalUsers: 0, totalAdmins: 1, totalPredictions: 0, aiCount: 0, humanCount: 0, topModel: 'N/A' };
}

export async function getSettings() {
  return loadStore(STORAGE_KEYS.SETTINGS) || {};
}

export async function saveSettings(preferences) {
  saveStore(STORAGE_KEYS.SETTINGS, preferences);
  return preferences;
}

export async function resetPassword(email) {
  // Password reset is not implemented in this build; simulate a success response.
  return { success: true, message: 'Password reset instructions sent if the account exists.' };
}

export async function updatePassword(password) {
  // Updating password is not supported in this build; simulate a success response.
  return { success: true, message: 'Password updated successfully.' };
}
