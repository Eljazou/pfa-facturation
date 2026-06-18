import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getInvoices as fbGetInvoices,
  getAllInvoices as fbGetAllInvoices,
  createInvoice as fbCreateInvoice,
  updateInvoice as fbUpdateInvoice,
  updateStatus as fbUpdateStatus,
  deleteInvoice as fbDeleteInvoice,
} from '../../services/firebaseService';
import { generateInvoiceNumber } from '../../utils/invoiceNumber';

export const fetchInvoices = createAsyncThunk(
  'invoices/fetchForUser',
  async (userId, { rejectWithValue }) => {
    try { return await fbGetInvoices(userId); }
    catch (err) { return rejectWithValue(err.message); }
  }
);

export const fetchAllInvoices = createAsyncThunk(
  'invoices/fetchAll',
  async (_, { rejectWithValue }) => {
    try { return await fbGetAllInvoices(); }
    catch (err) { return rejectWithValue(err.message); }
  }
);

export const createInvoice = createAsyncThunk(
  'invoices/create',
  async (invoiceData, { getState, rejectWithValue }) => {
    try {
      const existing = getState().invoices.invoices;
      const numero = generateInvoiceNumber(existing);
      const data = { ...invoiceData, numero, created_at: new Date().toISOString() };
      const result = await fbCreateInvoice(data);
      return { id: result.key, ...data };
    } catch (err) { return rejectWithValue(err.message); }
  }
);

export const updateInvoice = createAsyncThunk(
  'invoices/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      await fbUpdateInvoice(id, data);
      return { id, data };
    } catch (err) { return rejectWithValue(err.message); }
  }
);

export const deleteInvoice = createAsyncThunk(
  'invoices/delete',
  async (invoiceId, { rejectWithValue }) => {
    try {
      await fbDeleteInvoice(invoiceId);
      return invoiceId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateInvoiceStatus = createAsyncThunk(
  'invoices/updateStatus',
  async ({ id, status, adminId, reason }, { rejectWithValue }) => {
    try {
      const statusData = {
        statut: status,
        ...(adminId && { validated_by: adminId, validated_at: new Date().toISOString() }),
        ...(reason && { rejection_reason: reason }),
      };
      await fbUpdateStatus(id, statusData);
      return { id, statusData };
    } catch (err) { return rejectWithValue(err.message); }
  }
);

const pending = (state) => { state.loading = true; state.error = null; };
const rejected = (state, { payload }) => { state.loading = false; state.error = payload; };

const invoicesSlice = createSlice({
  name: 'invoices',
  initialState: { invoices: [], currentInvoice: null, loading: false, error: null },
  reducers: {
    setCurrentInvoice(state, action) { state.currentInvoice = action.payload; },
    clearCurrentInvoice(state) { state.currentInvoice = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, pending)
      .addCase(fetchInvoices.fulfilled, (state, { payload }) => {
        state.loading = false; state.invoices = payload;
      })
      .addCase(fetchInvoices.rejected, rejected)
      .addCase(fetchAllInvoices.pending, pending)
      .addCase(fetchAllInvoices.fulfilled, (state, { payload }) => {
        state.loading = false; state.invoices = payload;
      })
      .addCase(fetchAllInvoices.rejected, rejected)
      .addCase(createInvoice.pending, pending)
      .addCase(createInvoice.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.invoices.push(payload);
        state.currentInvoice = payload;
      })
      .addCase(createInvoice.rejected, rejected)
      .addCase(updateInvoice.pending, pending)
      .addCase(updateInvoice.fulfilled, (state, { payload }) => {
        state.loading = false;
        const idx = state.invoices.findIndex((i) => i.id === payload.id);
        if (idx !== -1) state.invoices[idx] = { ...state.invoices[idx], ...payload.data };
        if (state.currentInvoice?.id === payload.id)
          state.currentInvoice = { ...state.currentInvoice, ...payload.data };
      })
      .addCase(updateInvoice.rejected, rejected)
      .addCase(updateInvoiceStatus.pending, pending)
      .addCase(updateInvoiceStatus.fulfilled, (state, { payload }) => {
        state.loading = false;
        const idx = state.invoices.findIndex((i) => i.id === payload.id);
        if (idx !== -1) state.invoices[idx] = { ...state.invoices[idx], ...payload.statusData };
        if (state.currentInvoice?.id === payload.id)
          state.currentInvoice = { ...state.currentInvoice, ...payload.statusData };
      })
      .addCase(updateInvoiceStatus.rejected, rejected)
      .addCase(deleteInvoice.pending, pending)
      .addCase(deleteInvoice.fulfilled, (state, { payload: id }) => {
        state.loading = false;
        state.invoices = state.invoices.filter((i) => i.id !== id);
        if (state.currentInvoice?.id === id) state.currentInvoice = null;
      })
      .addCase(deleteInvoice.rejected, rejected);
  },
});

export const { setCurrentInvoice, clearCurrentInvoice } = invoicesSlice.actions;
export default invoicesSlice.reducer;
