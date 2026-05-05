import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Link, CircularProgress, Alert, InputAdornment, IconButton,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useState } from 'react';
import { login, clearError } from '../../store/authSlice';

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

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (user) navigate(user.role === 'admin' ? '/admin/dashboard' : from, { replace: true });
  }, [user, navigate, from]);

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: schema,
    onSubmit: (values) => dispatch(login(values)),
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <ReceiptLongIcon sx={{ fontSize: 48, color: 'primary.main' }} />
            <Typography variant="h5" mt={1}>PFA Facturation</Typography>
            <Typography variant="body2" color="text.secondary">Connectez-vous à votre compte</Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={formik.handleSubmit} noValidate>
            <TextField
              fullWidth label="Email" name="email" type="email"
              value={formik.values.email} onChange={formik.handleChange} onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon color="action" />
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
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPwd((p) => !p)} edge="end">
                      {showPwd ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit" fullWidth variant="contained" size="large"
              sx={{ mt: 3, mb: 2 }} disabled={loading}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Se connecter'}
            </Button>

            <Typography variant="body2" align="center">
              Pas encore de compte?{' '}
              <Link component={RouterLink} to="/register">Créer un compte</Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
