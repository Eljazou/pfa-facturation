import { useDispatch, useSelector } from 'react-redux';
import { Snackbar, Alert, Stack } from '@mui/material';
import { hideToast } from '../features/notifications/toastSlice';

export default function AlertToast() {
  const dispatch = useDispatch();
  const toasts = useSelector((s) => s.toast.toasts);

  return (
    <Stack
      spacing={1}
      sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 2000 }}
    >
      {toasts.map((t) => (
        <Snackbar
          key={t.id}
          open
          autoHideDuration={4000}
          onClose={() => dispatch(hideToast(t.id))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{ position: 'static', transform: 'none' }}
        >
          <Alert
            severity={t.severity}
            variant="filled"
            onClose={() => dispatch(hideToast(t.id))}
            sx={{ minWidth: 280 }}
          >
            {t.message}
          </Alert>
        </Snackbar>
      ))}
    </Stack>
  );
}
