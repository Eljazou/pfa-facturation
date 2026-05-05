import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { ref, set, get, onValue, off, push, update, remove } from 'firebase/database';
import { auth, db } from '../config/firebase';

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

// ── Users (admin) ─────────────────────────────────────────────────────────────

export const subscribeUsers = (callback) => {
  const r = ref(db, 'users');
  onValue(r, (snap) => {
    const raw = snap.val() || {};
    callback(Object.entries(raw).map(([id, v]) => ({ id, ...v })));
  });
  return () => off(r);
};
