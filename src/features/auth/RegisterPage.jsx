import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Link, CircularProgress, Alert, InputAdornment, IconButton,
  MenuItem,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { register, clearError } from '../../store/authSlice';

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
  const { user, loading, error } = useSelector((s) => s.auth);
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => { dispatch(clearError()); }, [dispatch]);
  useEffect(() => {
    if (user) navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard', { replace: true });
  }, [user, navigate]);

  const formik = useFormik({
    initialValues: { displayName: '', email: '', password: '', confirmPassword: '', role: 'user' },
    validationSchema: schema,
    onSubmit: ({ displayName, email, password, role }) =>
      dispatch(register({ displayName, email, password, role })),
  });

  const field = (name, label, props = {}) => (
    <TextField
      fullWidth margin="normal" name={name} label={label}
      value={formik.values[name]} onChange={formik.handleChange} onBlur={formik.handleBlur}
      error={formik.touched[name] && Boolean(formik.errors[name])}
      helperText={formik.touched[name] && formik.errors[name]}
      {...props}
    />
  );

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 460 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <ReceiptLongIcon sx={{ fontSize: 48, color: 'primary.main' }} />
            <Typography variant="h5" mt={1}>Créer un compte</Typography>
            <Typography variant="body2" color="text.secondary">PFA Facturation</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>{error}</Alert>}

          <Box component="form" onSubmit={formik.handleSubmit} noValidate>
            {field('displayName', 'Nom complet', {
              InputProps: { startAdornment: <InputAdornment position="start"><PersonOutlineIcon color="action" /></InputAdornment> },
            })}
            {field('email', 'Email', {
              type: 'email',
              InputProps: { startAdornment: <InputAdornment position="start"><EmailOutlinedIcon color="action" /></InputAdornment> },
            })}
            {field('password', 'Mot de passe', {
              type: showPwd ? 'text' : 'password',
              InputProps: {
                startAdornment: <InputAdornment position="start"><LockOutlinedIcon color="action" /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPwd((p) => !p)} edge="end">
                      {showPwd ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            })}
            {field('confirmPassword', 'Confirmer le mot de passe', {
              type: showPwd ? 'text' : 'password',
              InputProps: {
                startAdornment: <InputAdornment position="start"><LockOutlinedIcon color="action" /></InputAdornment>,
              },
            })}

            <TextField
              select fullWidth margin="normal" name="role" label="Rôle"
              value={formik.values.role} onChange={formik.handleChange} onBlur={formik.handleBlur}
              error={formik.touched.role && Boolean(formik.errors.role)}
              helperText={formik.touched.role && formik.errors.role}
            >
              <MenuItem value="user">Comptable (User)</MenuItem>
              <MenuItem value="admin">Administrateur</MenuItem>
            </TextField>

            <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3, mb: 2 }} disabled={loading}>
              {loading ? <CircularProgress size={22} color="inherit" /> : "S'inscrire"}
            </Button>

            <Typography variant="body2" align="center">
              Déjà un compte?{' '}
              <Link component={RouterLink} to="/login">Se connecter</Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
