import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginUser, logoutUser, registerUser, getUserProfile } from '../services/firebaseService';

const getFriendlyError = (code) => {
  switch (code) {
    case 'auth/user-not-found':        return 'Aucun compte trouvé avec cet email.';
    case 'auth/wrong-password':        return 'Mot de passe incorrect.';
    case 'auth/invalid-email':         return 'Adresse email invalide.';
    case 'auth/user-disabled':         return 'Ce compte a été désactivé.';
    case 'auth/too-many-requests':     return 'Trop de tentatives. Réessayez dans quelques minutes.';
    case 'auth/network-request-failed':return 'Problème de connexion. Vérifiez votre internet.';
    case 'auth/email-already-in-use':  return 'Cet email est déjà utilisé par un autre compte.';
    case 'auth/weak-password':         return 'Le mot de passe doit contenir au moins 6 caractères.';
    case 'auth/popup-closed-by-user':  return 'Connexion annulée.';
    case 'auth/invalid-credential':    return 'Email ou mot de passe incorrect.';
    default:                           return 'Une erreur est survenue. Réessayez.';
  }
};

export const login = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const cred = await loginUser(email, password);
    const profile = await getUserProfile(cred.user.uid);
    return { uid: cred.user.uid, email: cred.user.email, ...profile };
  } catch (err) {
    return rejectWithValue(getFriendlyError(err.code));
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
      return rejectWithValue(getFriendlyError(err.code));
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await logoutUser();
  } catch (err) {
    return rejectWithValue(getFriendlyError(err.code));
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
