const BASE = 'http://localhost:3001';

const request = async (path, options = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`JSON Server error: ${res.status}`);
  return res.json();
};

// ── Articles ──────────────────────────────────────────────────────────────────
export const getArticles = () => request('/articles');
export const getArticle = (id) => request(`/articles/${id}`);
export const createArticle = (data) => request('/articles', { method: 'POST', body: JSON.stringify(data) });
export const updateArticle = (id, data) => request(`/articles/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteArticle = (id) => request(`/articles/${id}`, { method: 'DELETE' });

// ── Categories ────────────────────────────────────────────────────────────────
export const getCategories = () => request('/categories');
export const createCategory = (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) });
export const updateCategory = (id, data) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCategory = (id) => request(`/categories/${id}`, { method: 'DELETE' });

// ── Settings ──────────────────────────────────────────────────────────────────
export const getSettings = () => request('/settings');
export const updateSetting = (id, data) => request(`/settings/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const createSetting = (data) => request('/settings', { method: 'POST', body: JSON.stringify(data) });

// ── Currencies ────────────────────────────────────────────────────────────────
export const getCurrencies = () => request('/currencies');
export const createCurrency = (data) => request('/currencies', { method: 'POST', body: JSON.stringify(data) });
export const updateCurrency = (id, data) => request(`/currencies/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCurrency = (id) => request(`/currencies/${id}`, { method: 'DELETE' });
