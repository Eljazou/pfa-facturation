import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box, TextField, Button, Typography, Link, CircularProgress, Alert,
  InputAdornment, IconButton, Stack,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { login, clearError } from '../../store/authSlice';
import AuthSplitLayout from '../../components/AuthSplitLayout';

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
    </AuthSplitLayout>
  );
}
