import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { ref, onValue, off, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../config/firebase';
import { setPendingCount } from '../features/notifications/notificationsSlice';

const toArray = (val) =>
  val ? Object.entries(val).map(([id, v]) => ({ id, ...v })) : [];

export function useInvoiceListener(invoiceId) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!invoiceId) { setLoading(false); return; }
    const r = ref(db, `factures/${invoiceId}`);
    const unsub = onValue(
      r,
      (snap) => {
        setInvoice(snap.exists() ? { id: invoiceId, ...snap.val() } : null);
        setLoading(false);
      },
      (err) => { setError(err); setLoading(false); }
    );
    return () => { off(r); unsub?.(); };
  }, [invoiceId]);

  return { invoice, loading, error };
}

export function useUserInvoicesListener(userId) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const r = query(ref(db, 'factures'), orderByChild('userId'), equalTo(userId));
    const unsub = onValue(r, (snap) => {
      setInvoices(toArray(snap.val()));
      setLoading(false);
    });
    return () => { off(r); unsub?.(); };
  }, [userId]);

  return { invoices, loading };
}

export function useAdminInvoicesListener() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const r = ref(db, 'factures');
    const unsub = onValue(r, (snap) => {
      const list = toArray(snap.val()).sort(
        (a, b) => (b.created_at || '').localeCompare(a.created_at || '')
      );
      setInvoices(list);
      setLoading(false);
    });
    return () => { off(r); unsub?.(); };
  }, []);

  return { invoices, loading };
}

export function usePendingCountListener() {
  const dispatch = useDispatch();

  useEffect(() => {
    const r = query(ref(db, 'factures'), orderByChild('statut'), equalTo('pending'));
    const unsub = onValue(r, (snap) => {
      const count = snap.exists() ? Object.keys(snap.val()).length : 0;
      dispatch(setPendingCount(count));
    });
    return () => { off(r); unsub?.(); };
  }, [dispatch]);
}
