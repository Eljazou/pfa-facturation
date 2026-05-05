import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Provider, useSelector } from 'react-redux';
import store from './store';
import theme from './theme';
import AppRouter from './routes/AppRouter';
import useAuthSync from './hooks/useAuth';
import AlertToast from './components/AlertToast';
import { useNotifications } from './hooks/useNotifications';
import { usePendingCountListener } from './hooks/useInvoiceListener';

function AppWithAuth() {
  useAuthSync();
  const user = useSelector((s) => s.auth.user);
  const isAdmin = user?.role === 'admin';

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
