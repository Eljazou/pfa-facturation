import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { onAuthChange, getUserProfile } from '../services/firebaseService';
import { setUser, clearUser } from '../store/authSlice';

// Syncs Firebase onAuthStateChanged → Redux store.
// Mount once at app root level.
export default function useAuthSync() {
  const dispatch = useDispatch();

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        dispatch(setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...profile }));
      } else {
        dispatch(clearUser());
      }
    });
    return unsub;
  }, [dispatch]);
}
