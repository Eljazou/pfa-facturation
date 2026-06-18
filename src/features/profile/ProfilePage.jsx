import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Paper, Typography, Avatar, Stack, TextField, Button, Chip, Divider,
  Grid, Snackbar, Alert, CircularProgress, IconButton, InputAdornment, Tooltip,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { updateUserDisplayName, changeUserPassword, updateUserPhoto } from '../../services/firebaseService';
import { setUser } from '../../store/authSlice';
import { fetchInvoices, fetchAllInvoices } from '../invoices/invoicesSlice';
import { computeUserKPIs } from '../../services/dashboardService';
import { formatAmount } from '../../utils/currencyService';

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? String(iso) : d.toLocaleDateString('fr-FR');
};

export default function ProfilePage() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const invoices = useSelector((s) => s.invoices.invoices);
  const currencies = useSelector((s) => s.settings.currencies);
  const isAdmin = user?.role === 'admin';

  const [name, setName] = useState(user?.displayName || '');
  const [savingName, setSavingName] = useState(false);

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);

  const [savingPhoto, setSavingPhoto] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (msg, severity = 'success') => setToast({ msg, severity });

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Fichier non supporté (PNG, JPG, WebP uniquement)', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { showToast('Image trop grande (max 5 Mo)', 'error'); return; }

    setSavingPhoto(true);
    try {
      const base64 = await resizeImage(file, 200);
      await updateUserPhoto(user.uid, base64);
      dispatch(setUser({ ...user, photoURL: base64 }));
      showToast('Photo de profil mise à jour');
    } catch (err) {
      showToast(err.message || 'Erreur', 'error');
    } finally {
      setSavingPhoto(false);
      e.target.value = '';
    }
  };

  useEffect(() => {
    if (!user?.uid) return;
    if (isAdmin) dispatch(fetchAllInvoices());
    else         dispatch(fetchInvoices(user.uid));
  }, [dispatch, user?.uid, isAdmin]);

  useEffect(() => { setName(user?.displayName || ''); }, [user?.displayName]);

  const kpis = useMemo(() => computeUserKPIs(invoices, user?.uid), [invoices, user?.uid]);
  const devise = 'MAD';

  const handleSaveName = async () => {
    if (!name.trim() || name === user.displayName) return;
    setSavingName(true);
    try {
      await updateUserDisplayName(user.uid, name.trim());
      dispatch(setUser({ ...user, displayName: name.trim() }));
      showToast('Nom mis à jour');
    } catch (e) {
      showToast(e.message || 'Erreur', 'error');
    } finally {
      setSavingName(false);
    }
  };

  const pwError = (() => {
    if (!pw.next && !pw.current && !pw.confirm) return null;
    if (pw.next.length < 6) return 'Le nouveau mot de passe doit contenir au moins 6 caractères';
    if (pw.next !== pw.confirm) return 'Les mots de passe ne correspondent pas';
    if (!pw.current) return 'Mot de passe actuel requis';
    return null;
  })();

  const handleChangePw = async () => {
    if (pwError) return;
    setSavingPw(true);
    try {
      await changeUserPassword(pw.current, pw.next);
      setPw({ current: '', next: '', confirm: '' });
      showToast('Mot de passe modifié');
    } catch (e) {
      const msg = e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential'
        ? 'Mot de passe actuel incorrect'
        : e.message || 'Erreur';
      showToast(msg, 'error');
    } finally {
      setSavingPw(false);
    }
  };

  if (!user) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  const initials = (user.displayName || user.email || 'U').slice(0, 2).toUpperCase();

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>Mon profil</Typography>

      <Grid container spacing={3}>
        {/* Header card */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
              {/* Clickable avatar with camera overlay */}
              <Tooltip title="Changer la photo">
                <Box
                  component="label"
                  htmlFor="photo-upload"
                  sx={{ position: 'relative', cursor: 'pointer', display: 'inline-flex', borderRadius: '50%' }}
                >
                  <Avatar
                    src={user.photoURL || undefined}
                    sx={{ width: 88, height: 88, bgcolor: 'primary.main', fontSize: 32 }}
                  >
                    {!user.photoURL && initials}
                  </Avatar>
                  {/* Dark overlay on hover */}
                  <Box sx={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    bgcolor: 'rgba(0,0,0,0.45)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    '&:hover': { opacity: 1 },
                  }}>
                    {savingPhoto
                      ? <CircularProgress size={22} sx={{ color: '#fff' }} />
                      : <CameraAltIcon sx={{ color: '#fff', fontSize: 26 }} />}
                  </Box>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handlePhotoChange}
                    disabled={savingPhoto}
                  />
                </Box>
              </Tooltip>
              <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
                <Typography variant="h6" fontWeight={700}>
                  {user.displayName || '(sans nom)'}
                </Typography>
                <Typography color="text.secondary">{user.email}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                  <Chip
                    icon={<PersonIcon />}
                    label={isAdmin ? 'Administrateur' : 'Comptable'}
                    color={isAdmin ? 'secondary' : 'primary'}
                    size="small"
                  />
                  {user.createdAt && (
                    <Chip label={`Membre depuis ${fmtDate(user.createdAt)}`} size="small" variant="outlined" />
                  )}
                </Stack>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Stats (only for normal users — admin sees all anyway) */}
        {!isAdmin && (
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Mon activité</Typography>
              <Grid container spacing={3}>
                <Stat label="Total factures"     value={kpis.total_factures} />
                <Stat label="Validées"           value={kpis.total_validees} />
                <Stat label="En attente"         value={kpis.total_en_attente} />
                <Stat label="Payées"             value={kpis.total_payees} />
                <Stat label="Montant encaissé"   value={formatAmount(kpis.montant_encaisse, devise, currencies)} />
                <Stat label="Moyenne / facture"  value={formatAmount(kpis.moyenne_facture, devise, currencies)} />
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* Edit name */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Informations</Typography>
            <Stack spacing={2}>
              <TextField label="Email" value={user.email} fullWidth disabled />
              <TextField
                label="Nom d'affichage"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
              />
              <Box>
                <Button
                  variant="contained"
                  onClick={handleSaveName}
                  disabled={savingName || !name.trim() || name === user.displayName}
                  startIcon={savingName ? <CircularProgress size={16} /> : null}
                >
                  Enregistrer
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Change password */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <LockIcon color="action" fontSize="small" />
              <Typography variant="subtitle1" fontWeight={600}>Changer le mot de passe</Typography>
            </Stack>
            <Stack spacing={2}>
              <PwField
                label="Mot de passe actuel"
                value={pw.current}
                show={showPw.current}
                onToggle={() => setShowPw({ ...showPw, current: !showPw.current })}
                onChange={(v) => setPw({ ...pw, current: v })}
              />
              <PwField
                label="Nouveau mot de passe"
                value={pw.next}
                show={showPw.next}
                onToggle={() => setShowPw({ ...showPw, next: !showPw.next })}
                onChange={(v) => setPw({ ...pw, next: v })}
              />
              <PwField
                label="Confirmer le nouveau mot de passe"
                value={pw.confirm}
                show={showPw.confirm}
                onToggle={() => setShowPw({ ...showPw, confirm: !showPw.confirm })}
                onChange={(v) => setPw({ ...pw, confirm: v })}
              />
              {pwError && pw.next && <Alert severity="warning">{pwError}</Alert>}
              <Box>
                <Button
                  variant="contained"
                  onClick={handleChangePw}
                  disabled={savingPw || !!pwError || !pw.current || !pw.next || !pw.confirm}
                  startIcon={savingPw ? <CircularProgress size={16} /> : null}
                >
                  Modifier le mot de passe
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Account info */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Compte</Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1}>
              <InfoRow label="Identifiant utilisateur" value={user.uid} mono />
              <InfoRow label="Rôle" value={isAdmin ? 'Administrateur' : 'Comptable (utilisateur)'} />
              {user.createdAt && <InfoRow label="Compte créé le" value={fmtDate(user.createdAt)} />}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={!!toast}
        autoHideDuration={3500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? <Alert severity={toast.severity}>{toast.msg}</Alert> : <span />}
      </Snackbar>
    </Box>
  );
}

function PwField({ label, value, onChange, show, onToggle }) {
  return (
    <TextField
      label={label}
      type={show ? 'text' : 'password'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      fullWidth
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton onClick={onToggle} edge="end" size="small">
              {show ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
}

function Stat({ label, value }) {
  return (
    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
      <Box sx={{ textAlign: 'center', p: 1 }}>
        <Typography variant="h6" fontWeight={700}>{value}</Typography>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
      </Box>
    </Grid>
  );
}

function resizeImage(file, maxPx = 200) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const w = Math.round(img.width  * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width  = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function InfoRow({ label, value, mono }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography
        sx={{
          fontFamily: mono ? 'monospace' : 'inherit',
          fontSize: mono ? 12 : 14,
          wordBreak: 'break-all',
          textAlign: 'right',
        }}
      >
        {value || '—'}
      </Typography>
    </Box>
  );
}
