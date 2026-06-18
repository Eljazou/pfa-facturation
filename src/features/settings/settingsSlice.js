import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getSettingsObject, updateSetting,
  getCurrencies, createCurrency, updateCurrency, deleteCurrency,
  getCompanies, createCompany, updateCompany, deleteCompany,
} from '../../services/settingsService';
import { saveCompanySettingsToFirebase } from '../../services/firebaseService';

const COMPANY_KEYS = new Set([
  'company_name', 'company_address', 'company_phone', 'company_email',
  'company_ice', 'company_rc', 'company_if', 'company_logo',
]);

export const fetchSettings = createAsyncThunk('settings/fetch', async () => {
  const [settings, currencies, companies] = await Promise.all([
    getSettingsObject().catch(() => ({})),
    getCurrencies().catch(() => []),
    getCompanies().catch(() => []),
  ]);
  return { settings, currencies, companies };
});

export const saveSetting = createAsyncThunk(
  'settings/save',
  async ({ key, value }) => {
    await updateSetting(key, value);
    if (COMPANY_KEYS.has(key)) {
      await saveCompanySettingsToFirebase({ [key]: value }).catch(() => {});
    }
    return { key, value };
  }
);

export const addCurrencyThunk = createAsyncThunk(
  'settings/addCurrency',
  async (data) => createCurrency(data)
);
export const updateCurrencyThunk = createAsyncThunk(
  'settings/updateCurrency',
  async ({ id, data }) => updateCurrency(id, data)
);
export const deleteCurrencyThunk = createAsyncThunk(
  'settings/deleteCurrency',
  async (id) => { await deleteCurrency(id); return id; }
);

export const addCompanyThunk = createAsyncThunk(
  'settings/addCompany',
  async (data) => createCompany(data)
);
export const updateCompanyThunk = createAsyncThunk(
  'settings/updateCompany',
  async ({ id, data }) => updateCompany(id, data)
);
export const deleteCompanyThunk = createAsyncThunk(
  'settings/deleteCompany',
  async (id) => { await deleteCompany(id); return id; }
);

const initialState = {
  settings: {},
  currencies: [],
  companies: [],
  activeCurrency: 'MAD',
  loading: false,
  error: null,
};

const slice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setActiveCurrency(state, action) { state.activeCurrency = action.payload; },
  },
  extraReducers: (b) => {
    b.addCase(fetchSettings.pending,  (s) => { s.loading = true; s.error = null; })
     .addCase(fetchSettings.rejected, (s, { error }) => { s.loading = false; s.error = error.message; })
     .addCase(fetchSettings.fulfilled, (s, { payload }) => {
       s.loading = false;
       s.settings   = payload.settings;
       s.currencies = payload.currencies;
       s.companies  = payload.companies;
       if (!s.activeCurrency && payload.settings.default_currency) {
         s.activeCurrency = payload.settings.default_currency;
       }
     })
     .addCase(saveSetting.fulfilled, (s, { payload }) => { s.settings[payload.key] = payload.value; })
     .addCase(addCurrencyThunk.fulfilled,    (s, { payload }) => { s.currencies.push(payload); })
     .addCase(updateCurrencyThunk.fulfilled, (s, { payload }) => {
       const i = s.currencies.findIndex((c) => c.id === payload.id);
       if (i >= 0) s.currencies[i] = payload;
     })
     .addCase(deleteCurrencyThunk.fulfilled, (s, { payload: id }) => {
       s.currencies = s.currencies.filter((c) => c.id !== id);
     })
     .addCase(addCompanyThunk.fulfilled,    (s, { payload }) => { s.companies.push(payload); })
     .addCase(updateCompanyThunk.fulfilled, (s, { payload }) => {
       const i = s.companies.findIndex((c) => c.id === payload.id);
       if (i >= 0) s.companies[i] = payload;
     })
     .addCase(deleteCompanyThunk.fulfilled, (s, { payload: id }) => {
       s.companies = s.companies.filter((c) => c.id !== id);
     });
  },
});

export const { setActiveCurrency } = slice.actions;
export default slice.reducer;
