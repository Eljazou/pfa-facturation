import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  addClient as fbAddClient,
  updateClient as fbUpdateClient,
  deleteClient as fbDeleteClient,
} from '../../services/firebaseService';

export const addClient = createAsyncThunk(
  'clients/add',
  async ({ data, userId }, { rejectWithValue }) => {
    try {
      await fbAddClient(data, userId);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const editClient = createAsyncThunk(
  'clients/edit',
  async ({ id, data, userId }, { rejectWithValue }) => {
    try {
      await fbUpdateClient(userId, id, data);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const removeClient = createAsyncThunk(
  'clients/remove',
  async ({ id, userId }, { rejectWithValue }) => {
    try {
      await fbDeleteClient(userId, id);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const clientsSlice = createSlice({
  name: 'clients',
  initialState: { clients: [], loading: false, error: null },
  reducers: {
    setClients(state, action) {
      state.clients = action.payload;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addClient.rejected, (state, { payload }) => { state.error = payload; })
      .addCase(editClient.rejected, (state, { payload }) => { state.error = payload; })
      .addCase(removeClient.rejected, (state, { payload }) => { state.error = payload; });
  },
});

export const { setClients } = clientsSlice.actions;
export default clientsSlice.reducer;
