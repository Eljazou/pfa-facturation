import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginUser, logoutUser, registerUser, getUserProfile } from '../services/firebaseService';

export const login = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const cred = await loginUser(email, password);
    const profile = await getUserProfile(cred.user.uid);
    return { uid: cred.user.uid, email: cred.user.email, ...profile };
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const register = createAsyncThunk(
  'auth/register',
  async ({ email, password, displayName, role }, { rejectWithValue }) => {
    try {
      const user = await registerUser(email, password, displayName, role);
      const profile = await getUserProfile(user.uid);
      return { uid: user.uid, email: user.email, ...profile };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await logoutUser();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,       // { uid, email, displayName, role }
    loading: false,
    initialized: false,
    error: null,
  },
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      state.initialized = true;
    },
    clearUser(state) {
      state.user = null;
      state.initialized = true;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // login
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, { payload }) => { state.loading = false; state.user = payload; })
      .addCase(login.rejected, (state, { payload }) => { state.loading = false; state.error = payload; })
      // register
      .addCase(register.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(register.fulfilled, (state, { payload }) => { state.loading = false; state.user = payload; })
      .addCase(register.rejected, (state, { payload }) => { state.loading = false; state.error = payload; })
      // logout
      .addCase(logout.fulfilled, (state) => { state.user = null; });
  },
});

export const { setUser, clearUser, clearError } = authSlice.actions;
export default authSlice.reducer;
