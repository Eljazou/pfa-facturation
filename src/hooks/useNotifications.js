import { useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ref, onValue, off } from 'firebase/database';
import { db } from '../config/firebase';
import { setNotifications } from '../features/notifications/notificationsSlice';

const toList = (snap, bucket) => {
  const raw = snap.val() || {};
  return Object.entries(raw).map(([id, v]) => ({ id, bucket, ...v }));
};

const sortByDate = (list) =>
  [...list].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

export function useNotifications(userId) {
  const dispatch = useDispatch();
  const role = useSelector((s) => s.auth.user?.role);
  const notifications = useSelector((s) => s.notifications.notifications);

  // Per-bucket cache so we can merge without re-fetching
  const cache = useRef({ user: [], admin: [] });

  useEffect(() => {
    if (!userId) return;
    cache.current = { user: [], admin: [] };

    const flush = () => {
      dispatch(setNotifications(sortByDate([...cache.current.user, ...cache.current.admin])));
    };

    const userRef = ref(db, `notifications/${userId}`);
    const onUser = onValue(userRef, (snap) => {
      cache.current.user = toList(snap, 'user');
      flush();
    });

    let adminRef = null;
    let onAdmin = null;
    if (role === 'admin') {
      adminRef = ref(db, 'notifications/admin');
      onAdmin = onValue(adminRef, (snap) => {
        cache.current.admin = toList(snap, 'admin');
        flush();
      });
    }

    return () => {
      off(userRef);
      onUser?.();
      if (adminRef) {
        off(adminRef);
        onAdmin?.();
      }
    };
  }, [userId, role, dispatch]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  return { notifications, unreadCount };
}
