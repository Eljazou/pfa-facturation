import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { useEffect, useRef } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from './config/firebase';
import store from './store';
import theme from './theme';
import AppRouter from './routes/AppRouter';
import useAuthSync from './hooks/useAuth';
import AlertToast from './components/AlertToast';
import { useNotifications } from './hooks/useNotifications';
import { usePendingCountListener } from './hooks/useInvoiceListener';
import { fetchSettings } from './features/settings/settingsSlice';
import { triggerNotification } from './services/notificationService';

function AppWithAuth() {
  useAuthSync();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const isAdmin = user?.role === 'admin';

  useEffect(() => { dispatch(fetchSettings()); }, [dispatch]);

  useNotifications(user?.uid);

  return (
    <>
      {isAdmin && <PendingCountBoot />}
      {isAdmin && <AdminPendingNotifier uid={user?.uid} />}
      <AppRouter />
      <AlertToast />
    </>
  );
}

function PendingCountBoot() {
  usePendingCountListener();
  return null;
}

// Watches ALL factures in real-time and notifies admin for any pending invoice
// not yet seen. Uses localStorage to persist seen IDs across sessions so the
// admin is notified even for invoices submitted while they were offline.
function AdminPendingNotifier({ uid }) {
  const seenRef = useRef(null);

  useEffect(() => {
    if (!uid) return;

    const storageKey = `fp_notified_${uid}`;
    seenRef.current = new Set(JSON.parse(localStorage.getItem(storageKey) || '[]'));

    const r = ref(db, 'factures');
    const unsub = onValue(r, async (snap) => {
      if (!snap.exists()) return;

      const pending = Object.entries(snap.val())
        .map(([id, v]) => ({ id, ...v }))
        .filter((i) => i.statut === 'pending');

      // Determine new invoices synchronously before any async work
      const fresh = pending.filter((i) => !seenRef.current.has(i.id));
      if (!fresh.length) return;

      // Mark all as seen immediately to prevent duplicates on rapid re-fires
      fresh.forEach((i) => seenRef.current.add(i.id));
      localStorage.setItem(storageKey, JSON.stringify([...seenRef.current]));

      // Write bell notifications in parallel
      await Promise.all(
        fresh.map((inv) =>
          triggerNotification('invoice_submitted', inv, uid).catch(() => {})
        )
      );
    });

    return () => unsub();
  }, [uid]);

  return null;
}

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AppWithAuth />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}
