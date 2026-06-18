const BASE = import.meta.env.VITE_JSON_SERVER_URL || 'http://localhost:3001';

const request = async (path, options = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`JSON Server error: ${res.status}`);
  return res.json();
};

// ── Articles ──────────────────────────────────────────────────────────────────
export const getArticles    = () => request('/articles');
export const getArticle     = (id) => request(`/articles/${id}`);
export const createArticle  = (data) => request('/articles', { method: 'POST', body: JSON.stringify(data) });
export const updateArticle  = (id, data) => request(`/articles/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteArticle  = (id) => request(`/articles/${id}`, { method: 'DELETE' });

// ── Categories (CRUD — not in settingsService) ────────────────────────────────
export const createCategory = (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) });
export const updateCategory = (id, data) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCategory = (id) => request(`/categories/${id}`, { method: 'DELETE' });

// ── Re-exports from settingsService (canonical source for these) ──────────────
export {
  getSettings,
  getSettingsObject,
  updateSetting,
  getCurrencies,
  createCurrency,
  updateCurrency,
  deleteCurrency,
  getCategories,
  updateCategoryTVA,
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
} from './settingsService';
