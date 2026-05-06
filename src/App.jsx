import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import store from './store';
import theme from './theme';
import AppRouter from './routes/AppRouter';
import useAuthSync from './hooks/useAuth';
import AlertToast from './components/AlertToast';
import { useNotifications } from './hooks/useNotifications';
import { usePendingCountListener } from './hooks/useInvoiceListener';
import { fetchSettings } from './features/settings/settingsSlice';

function AppWithAuth() {
  useAuthSync();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const isAdmin = user?.role === 'admin';

  // Load settings (currencies, company, companies) once on app boot
  useEffect(() => { dispatch(fetchSettings()); }, [dispatch]);

  // Real-time notification listener for current user
  useNotifications(user?.uid);

  // Admins also need pending-invoice count for sidebar badge
  return (
    <>
      {isAdmin && <PendingCountBoot />}
      <AppRouter />
      <AlertToast />
    </>
  );
}

function PendingCountBoot() {
  usePendingCountListener();
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
