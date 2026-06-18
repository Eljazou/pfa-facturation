import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box, TextField, Button, Typography, Link, CircularProgress, Alert,
  InputAdornment, IconButton, Stack, Dialog, DialogTitle, DialogContent,
  DialogActions,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { login, clearError } from '../../store/authSlice';
import AuthSplitLayout from '../../components/AuthSplitLayout';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase';

const schema = Yup.object({
  email: Yup.string().email('Email invalide').required('Email requis'),
  password: Yup.string().min(6, 'Min 6 caractères').required('Mot de passe requis'),
});

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, error } = useSelector((s) => s.auth);
  const [showPwd, setShowPwd] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState(null);

  const handleResetPassword = async () => {
    if (!resetEmail) return;
    setResetLoading(true);
    setResetMsg(null);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMsg({ type: 'success', text: 'Email de réinitialisation envoyé. Vérifiez votre boîte mail.' });
    } catch (err) {
      const msgs = {
        'auth/user-not-found':  'Aucun compte avec cet email.',
        'auth/invalid-email':   'Email invalide.',
      };
      setResetMsg({ type: 'error', text: msgs[err.code] || err.message });
    } finally {
      setResetLoading(false);
    }
  };

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => { dispatch(clearError()); }, [dispatch]);
  useEffect(() => {
    if (user) navigate(user.role === 'admin' ? '/admin/dashboard' : from, { replace: true });
  }, [user, navigate, from]);

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: schema,
    onSubmit: (values) => dispatch(login(values)),
  });

  return (
    <AuthSplitLayout>
      {/* Mobile logo */}
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ display: { md: 'none' }, mb: 3 }}>
        <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ReceiptLongIcon sx={{ color: '#FFFFFF', fontSize: 20 }} />
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 700 }}>FacturaPro</Typography>
      </Stack>

      <Typography variant="h2" sx={{ mb: 0.5 }}>Bienvenue</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Connectez-vous à votre espace facturation
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={formik.handleSubmit} noValidate>
        <Stack spacing={2}>
          <TextField
            fullWidth label="Email" name="email" type="email"
            value={formik.values.email} onChange={formik.handleChange} onBlur={formik.handleBlur}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth label="Mot de passe" name="password"
            type={showPwd ? 'text' : 'password'}
            value={formik.values.password} onChange={formik.handleChange} onBlur={formik.handleBlur}
            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPwd((p) => !p)} edge="end" size="small">
                    {showPwd ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={() => { setResetEmail(formik.values.email); setResetMsg(null); setResetOpen(true); }}
              sx={{ fontWeight: 500 }}
            >
              Mot de passe oublié ?
            </Link>
          </Box>

          <Button
            type="submit" fullWidth variant="contained" size="large"
            disabled={loading}
            sx={{ mt: 1 }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Se connecter'}
          </Button>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={2} sx={{ my: 3 }}>
          <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
          <Typography variant="caption" color="text.secondary">ou</Typography>
          <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
        </Stack>

        <Typography variant="body2" align="center" color="text.secondary">
          Pas encore de compte ?{' '}
          <Link component={RouterLink} to="/register" sx={{ fontWeight: 600 }}>
            Créer un compte
          </Link>
        </Typography>
      </Box>

      {/* Forgot password dialog */}
      <Dialog
        open={resetOpen}
        onClose={() => !resetLoading && setResetOpen(false)}
        PaperProps={{ sx: { borderRadius: '16px' } }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Réinitialiser le mot de passe</DialogTitle>
        <DialogContent>
          {resetMsg && (
            <Alert severity={resetMsg.type} sx={{ mb: 2 }}>{resetMsg.text}</Alert>
          )}
          <TextField
            autoFocus
            fullWidth
            label="Adresse email"
            type="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            disabled={resetLoading || resetMsg?.type === 'success'}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setResetOpen(false)} variant="outlined" sx={{ borderRadius: '8px' }}>
            Fermer
          </Button>
          {resetMsg?.type !== 'success' && (
            <Button
              onClick={handleResetPassword}
              variant="contained"
              disabled={resetLoading || !resetEmail}
              sx={{ borderRadius: '8px' }}
            >
              {resetLoading ? <CircularProgress size={18} color="inherit" /> : 'Envoyer'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </AuthSplitLayout>
  );
}
