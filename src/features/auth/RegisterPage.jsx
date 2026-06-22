import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box, TextField, Button, Typography, Link, CircularProgress, Alert,
  InputAdornment, IconButton, MenuItem, Stack,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { register, clearError } from '../../store/authSlice';
import AuthSplitLayout from '../../components/AuthSplitLayout';

const schema = Yup.object({
  displayName: Yup.string().min(2, 'Min 2 caractères').required('Nom requis'),
  email: Yup.string().email('Email invalide').required('Email requis'),
  password: Yup.string().min(6, 'Min 6 caractères').required('Mot de passe requis'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Les mots de passe ne correspondent pas')
    .required('Confirmation requise'),
  role: Yup.string().oneOf(['user', 'admin']).required('Rôle requis'),
});

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { email: prefillEmail, name: prefillName, plan, fromPayment } = location.state || {};
  const { user, loading, error } = useSelector((s) => s.auth);
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => { dispatch(clearError()); }, [dispatch]);
  useEffect(() => {
    if (user) navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard', { replace: true });
  }, [user, navigate]);

  const formik = useFormik({
    initialValues: { displayName: prefillName || '', email: prefillEmail || '', password: '', confirmPassword: '', role: 'user' },
    validationSchema: schema,
    onSubmit: ({ displayName, email, password, role }) =>
      dispatch(register({ displayName, email, password, role })),
  });

  const field = (name, label, props = {}) => (
    <TextField
      fullWidth name={name} label={label}
      value={formik.values[name]} onChange={formik.handleChange} onBlur={formik.handleBlur}
      error={formik.touched[name] && Boolean(formik.errors[name])}
      helperText={formik.touched[name] && formik.errors[name]}
      {...props}
    />
  );

  return (
    <AuthSplitLayout>
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ display: { md: 'none' }, mb: 3 }}>
        <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ReceiptLongIcon sx={{ color: '#FFFFFF', fontSize: 20 }} />
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 700 }}>FacturaPro</Typography>
      </Stack>

      <Typography variant="h2" sx={{ mb: 0.5 }}>Créer un compte</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Rejoignez la plateforme en quelques secondes
      </Typography>

      {fromPayment && (
        <Alert severity="success" sx={{ mb: 2 }}>
          ✅ Paiement {plan} confirmé ! Finalisez la création de votre compte.
        </Alert>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>{error}</Alert>}

      <Box component="form" onSubmit={formik.handleSubmit} noValidate>
        <Stack spacing={2}>
          {field('displayName', 'Nom complet', {
            InputProps: {
              startAdornment: <InputAdornment position="start"><PersonOutlineIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
            },
          })}
          {field('email', 'Email', {
            type: 'email',
            InputProps: {
              startAdornment: <InputAdornment position="start"><EmailOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
            },
          })}
          {field('password', 'Mot de passe', {
            type: showPwd ? 'text' : 'password',
            InputProps: {
              startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPwd((p) => !p)} edge="end" size="small">
                    {showPwd ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          })}
          {field('confirmPassword', 'Confirmer le mot de passe', {
            type: showPwd ? 'text' : 'password',
            InputProps: {
              startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
            },
          })}

          <TextField
            select fullWidth name="role" label="Rôle"
            value={formik.values.role} onChange={formik.handleChange} onBlur={formik.handleBlur}
          >
            <MenuItem value="user">Comptable</MenuItem>
            <MenuItem value="admin">Administrateur</MenuItem>
          </TextField>

          <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mt: 1 }}>
            {loading ? <CircularProgress size={22} color="inherit" /> : "S'inscrire"}
          </Button>
        </Stack>

        <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 3 }}>
          Déjà un compte ?{' '}
          <Link component={RouterLink} to="/login" sx={{ fontWeight: 600 }}>
            Se connecter
          </Link>
        </Typography>
      </Box>
    </AuthSplitLayout>
  );
}
