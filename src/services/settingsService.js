const BASE = import.meta.env.VITE_JSON_SERVER_URL || 'http://localhost:3001';

const request = async (path, options = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`JSON Server error: ${res.status}`);
  return res.json();
};

// ── Settings (key/value) ──────────────────────────────────────────────────────

export const getSettings = () => request('/settings');

export async function getSettingsObject() {
  const list = await getSettings();
  return list.reduce((acc, s) => { acc[s.key] = s.value; return acc; }, {});
}

export async function updateSetting(key, value) {
  const list = await getSettings();
  const existing = list.find((s) => s.key === key);
  if (existing) {
    return request(`/settings/${existing.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...existing, value }),
    });
  }
  return request('/settings', {
    method: 'POST',
    body: JSON.stringify({ key, value }),
  });
}

// ── Currencies ────────────────────────────────────────────────────────────────

export const getCurrencies = () => request('/currencies');
export const createCurrency = (data) =>
  request('/currencies', { method: 'POST', body: JSON.stringify(data) });
export const updateCurrency = (id, data) =>
  request(`/currencies/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCurrency = (id) =>
  request(`/currencies/${id}`, { method: 'DELETE' });

// ── Companies ─────────────────────────────────────────────────────────────────

export const getCompanies = () => request('/companies').catch(() => []);
export const createCompany = (data) =>
  request('/companies', { method: 'POST', body: JSON.stringify(data) });
export const updateCompany = (id, data) =>
  request(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCompany = (id) =>
  request(`/companies/${id}`, { method: 'DELETE' });

// ── Categories (TVA per categorie) ────────────────────────────────────────────

export const getCategories = () => request('/categories');
export const updateCategoryTVA = (id, payload) =>
  request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
