import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  getAuth,
} from 'firebase/auth';
import { ref, set, get, onValue, off, push, update, remove } from 'firebase/database';
import { initializeApp, deleteApp } from 'firebase/app';
import { auth, db } from '../config/firebase';
import { logger } from '../utils/logger';

function handleFirebaseError(error) {
  logger.error('Firebase error:', error.code || error.message);
  if (error.code === 'PERMISSION_DENIED' || error.message?.includes('Permission denied')) {
    throw new Error('Accès non autorisé');
  }
  throw error;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export const registerUser = async (email, password, displayName, role = 'user') => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await set(ref(db, `users/${cred.user.uid}`), {
    displayName,
    email,
    role,
    createdAt: new Date().toISOString(),
  });
  return cred.user;
};

export const loginUser = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const logoutUser = () => signOut(auth);

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

export const getUserProfile = async (uid) => {
  const snap = await get(ref(db, `users/${uid}`));
  return snap.exists() ? snap.val() : null;
};

export const updateUserDisplayName = async (uid, displayName) => {
  if (auth.currentUser) await updateProfile(auth.currentUser, { displayName });
  await update(ref(db, `users/${uid}`), { displayName });
};

export const updateUserPhoto = async (uid, photoURL) => {
  await update(ref(db, `users/${uid}`), { photoURL });
};

export const changeUserPassword = async (currentPassword, newPassword) => {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('Non connecté');
  const cred = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, newPassword);
};

// ── Clients ──────────────────────────────────────────────────────────────────

export const addClient = (clientData, userId) =>
  push(ref(db, `clients/${userId}`), clientData);

export const updateClient = (userId, id, data) =>
  update(ref(db, `clients/${userId}/${id}`), data);

export const deleteClient = (userId, id) =>
  remove(ref(db, `clients/${userId}/${id}`));

export const subscribeClients = (userId, callback) => {
  const r = ref(db, `clients/${userId}`);
  onValue(r, (snap) => {
    const raw = snap.val() || {};
    callback(Object.entries(raw).map(([id, v]) => ({ id, ...v })));
  });
  return () => off(r);
};

export const getClients = async (userId) => {
  const snap = await get(ref(db, `clients/${userId}`));
  const raw = snap.val() || {};
  return Object.entries(raw).map(([id, v]) => ({ id, ...v }));
};

// ── Invoices ─────────────────────────────────────────────────────────────────

export const createInvoice = (data) => push(ref(db, 'factures'), data);

export const updateInvoice = (id, data) => update(ref(db, `factures/${id}`), data);

export const deleteInvoice = (id) => remove(ref(db, `factures/${id}`));

export const getInvoices = async (userId) => {
  const snap = await get(ref(db, 'factures'));
  const raw = snap.val() || {};
  return Object.entries(raw)
    .map(([id, v]) => ({ id, ...v }))
    .filter((inv) => inv.userId === userId);
};

export const getAllInvoices = async () => {
  const snap = await get(ref(db, 'factures'));
  const raw = snap.val() || {};
  return Object.entries(raw).map(([id, v]) => ({ id, ...v }));
};

export const updateStatus = (id, statusData) =>
  update(ref(db, `factures/${id}`), statusData);

export const subscribeInvoices = (callback) => {
  const r = ref(db, 'factures');
  onValue(r, (snap) => {
    const raw = snap.val() || {};
    callback(Object.entries(raw).map(([id, v]) => ({ id, ...v })));
  });
  return () => off(r);
};

export const subscribeInvoice = (id, callback) => {
  const r = ref(db, `factures/${id}`);
  onValue(r, (snap) => callback(snap.exists() ? { id, ...snap.val() } : null));
  return () => off(r);
};

export const getInvoice = async (id) => {
  const snap = await get(ref(db, `factures/${id}`));
  return snap.exists() ? { id, ...snap.val() } : null;
};

// ── Invoice counter (auto-number) ─────────────────────────────────────────────

export const getNextInvoiceNumber = async (prefix = 'FAC') => {
  const year = new Date().getFullYear();
  const snap = await get(ref(db, 'factures'));
  const count = snap.exists() ? Object.keys(snap.val()).length + 1 : 1;
  return `${prefix}-${year}-${String(count).padStart(4, '0')}`;
};

// ── Company settings (public read, used by public invoice page) ───────────────

const COMPANY_KEYS = [
  'company_name', 'company_address', 'company_phone', 'company_email',
  'company_ice', 'company_rc', 'company_if', 'company_logo',
];

export const saveCompanySettingsToFirebase = async (settingsObj) => {
  const payload = {};
  COMPANY_KEYS.forEach((k) => { if (k in settingsObj) payload[k] = settingsObj[k] ?? ''; });
  if (Object.keys(payload).length) await update(ref(db, 'companySettings'), payload);
};

export const getCompanySettingsFromFirebase = async () => {
  const snap = await get(ref(db, 'companySettings'));
  return snap.exists() ? snap.val() : {};
};

// ── Users (admin) ─────────────────────────────────────────────────────────────

export const subscribeUsers = (callback) => {
  const r = ref(db, 'users');
  onValue(r, (snap) => {
    const raw = snap.val() || {};
    callback(Object.entries(raw).map(([id, v]) => ({ id, ...v })));
  });
  return () => off(r);
};

export const updateUserRole = (uid, role) =>
  update(ref(db, `users/${uid}`), { role });

export const adminDeleteUser = (uid) => remove(ref(db, `users/${uid}`));

export const adminUpdateUser = (uid, { displayName, role }) => {
  const payload = {};
  if (displayName !== undefined) payload.displayName = displayName;
  if (role !== undefined) payload.role = role;
  return update(ref(db, `users/${uid}`), payload);
};

export const adminCreateUser = async (email, password, displayName, role = 'user') => {
  const config = {
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  };
  const secondary = initializeApp(config, `admin-create-${Date.now()}`);
  try {
    const secondaryAuth = getAuth(secondary);
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    await updateProfile(cred.user, { displayName });
    await set(ref(db, `users/${cred.user.uid}`), {
      displayName,
      email,
      role,
      createdAt: new Date().toISOString(),
    });
    await signOut(secondaryAuth);
    return cred.user;
  } finally {
    await deleteApp(secondary);
  }
};
