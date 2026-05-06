import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Tabs, Tab, Paper, Typography, TextField, Button, Stack, MenuItem,
  Snackbar, Alert, Divider, Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import StarIcon from '@mui/icons-material/Star';
import {
  saveSetting,
  addCurrencyThunk, updateCurrencyThunk, deleteCurrencyThunk,
} from './settingsSlice';
import { getCategories, updateCategoryTVA } from '../../services/settingsService';
import { compressImage, approxBase64Size } from '../../utils/imageCompress';

const TVA_OPTIONS = [0, 7, 10, 14, 20];

export default function SettingsPage() {
  const [tab, setTab] = useState(0);
  const [toast, setToast] = useState(null);
  const showToast = (msg, severity = 'success') => setToast({ msg, severity });

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>Paramètres</Typography>
      <Paper>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Entreprise" />
          <Tab label="TVA & Facturation" />
          <Tab label="Devises" />
          <Tab label="Email" />
          <Tab label="Archivage" />
        </Tabs>
        <Box sx={{ p: 3 }}>
          {tab === 0 && <CompanyTab onToast={showToast} />}
          {tab === 1 && <BillingTab onToast={showToast} />}
          {tab === 2 && <CurrenciesTab onToast={showToast} />}
          {tab === 3 && <EmailTab onToast={showToast} />}
          {tab === 4 && <ArchiveTab />}
        </Box>
      </Paper>

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

// ── Tab 1: Company ────────────────────────────────────────────────────────────
function CompanyTab({ onToast }) {
  const dispatch = useDispatch();
  const settings = useSelector((s) => s.settings.settings);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      company_name:    settings.company_name    || '',
      company_address: settings.company_address || '',
      company_ice:     settings.company_ice     || '',
      company_rc:      settings.company_rc      || '',
      company_if:      settings.company_if      || '',
      company_phone:   settings.company_phone   || '',
      company_email:   settings.company_email   || '',
      company_logo:    settings.company_logo    || '',
    });
  }, [settings]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { onToast('Format invalide', 'error'); return; }
    if (file.size > 5 * 1024 * 1024)     { onToast('Image > 5 MB', 'error'); return; }
    try {
      // Resize to max 400×200 + JPEG re-encode → keeps payload well under 100KB
      let b64 = await compressImage(file, { maxWidth: 400, maxHeight: 200, quality: 0.85 });
      // Fallback: if still too large (rare with PNG transparency), reduce quality
      if (approxBase64Size(b64) > 70_000) {
        b64 = await compressImage(file, { maxWidth: 300, maxHeight: 150, quality: 0.7, mimeType: 'image/jpeg' });
      }
      setForm({ ...form, company_logo: b64 });
      onToast(`Logo prêt (${Math.round(approxBase64Size(b64) / 1024)} KB)`, 'info');
    } catch (err) {
      onToast(err.message || 'Erreur de compression', 'error');
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const errors = [];
      if (form.company_ice && !/^\d{15}$/.test(form.company_ice)) errors.push('ICE doit contenir 15 chiffres');
      if (form.company_email && !/^\S+@\S+\.\S+$/.test(form.company_email)) errors.push('Email invalide');
      if (errors.length) { onToast(errors.join(' / '), 'error'); setSaving(false); return; }

      await Promise.all(
        Object.entries(form).map(([k, v]) => dispatch(saveSetting({ key: k, value: v })).unwrap())
      );
      onToast('Paramètres entreprise sauvegardés');
    } catch (e) {
      onToast(e.message || 'Erreur', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={2} sx={{ maxWidth: 720 }}>
      <TextField label="Raison sociale"  value={form.company_name    || ''} onChange={set('company_name')} fullWidth />
      <TextField label="Adresse"         value={form.company_address || ''} onChange={set('company_address')} fullWidth />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField label="ICE (15 chiffres)" value={form.company_ice || ''} onChange={set('company_ice')} fullWidth
          inputProps={{ inputMode: 'numeric', maxLength: 15 }} />
        <TextField label="RC" value={form.company_rc || ''} onChange={set('company_rc')} fullWidth />
        <TextField label="IF" value={form.company_if || ''} onChange={set('company_if')} fullWidth />
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField label="Téléphone" value={form.company_phone || ''} onChange={set('company_phone')} fullWidth />
        <TextField label="Email"     value={form.company_email || ''} onChange={set('company_email')} fullWidth />
      </Stack>

      <Divider />
      <Box>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Logo</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button variant="outlined" component="label">
            Choisir un logo
            <input type="file" accept="image/*" hidden onChange={handleLogo} />
          </Button>
          {form.company_logo && (
            <Box component="img" src={form.company_logo} alt="logo"
                 sx={{ width: 100, height: 60, objectFit: 'contain', border: '1px solid', borderColor: 'divider', p: 0.5, borderRadius: 1 }} />
          )}
          {form.company_logo && (
            <Button size="small" color="error" onClick={() => setForm({ ...form, company_logo: '' })}>Retirer</Button>
          )}
        </Stack>
      </Box>

      <Box>
        <Button variant="contained" onClick={save} disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : null}>
          Enregistrer
        </Button>
      </Box>
    </Stack>
  );
}

// ── Tab 2: Billing / TVA ──────────────────────────────────────────────────────
function BillingTab({ onToast }) {
  const dispatch = useDispatch();
  const settings = useSelector((s) => s.settings.settings);
  const [defaultTva, setDefaultTva] = useState(20);
  const [billingMethod, setBilling] = useState('simple');
  const [prefix, setPrefix]         = useState('FAC');
  const [reset, setReset]           = useState('annually');
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId]   = useState(null);
  const [editValue, setEditValue]   = useState(0);

  useEffect(() => {
    setDefaultTva(Number(settings.default_tva ?? settings.default_tva_rate ?? 20));
    setBilling(settings.default_billing_method || 'simple');
    setPrefix(settings.invoice_prefix || 'FAC');
    setReset(settings.invoice_number_reset || 'annually');
  }, [settings]);

  useEffect(() => { getCategories().then(setCategories).catch(() => {}); }, []);

  const saveAll = async () => {
    try {
      await Promise.all([
        dispatch(saveSetting({ key: 'default_tva', value: String(defaultTva) })).unwrap(),
        dispatch(saveSetting({ key: 'default_billing_method', value: billingMethod })).unwrap(),
        dispatch(saveSetting({ key: 'invoice_prefix', value: prefix })).unwrap(),
        dispatch(saveSetting({ key: 'invoice_number_reset', value: reset })).unwrap(),
      ]);
      onToast('Paramètres de facturation sauvegardés');
    } catch (e) { onToast(e.message || 'Erreur', 'error'); }
  };

  const saveCategoryTVA = async (cat) => {
    try {
      const updated = await updateCategoryTVA(cat.id, { ...cat, tva_rate: Number(editValue) });
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? updated : c)));
      setEditingId(null);
      onToast(`TVA ${cat.nom} mise à jour`);
    } catch (e) { onToast(e.message, 'error'); }
  };

  return (
    <Stack spacing={3} sx={{ maxWidth: 800 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField select label="TVA par défaut" value={defaultTva}
          onChange={(e) => setDefaultTva(Number(e.target.value))} sx={{ minWidth: 200 }}>
          {TVA_OPTIONS.map((v) => <MenuItem key={v} value={v}>{v}%</MenuItem>)}
        </TextField>
        <TextField select label="Méthode par défaut" value={billingMethod}
          onChange={(e) => setBilling(e.target.value)} sx={{ minWidth: 220 }}>
          <MenuItem value="simple">Simple (TVA 20%)</MenuItem>
          <MenuItem value="line_discount">Remise par ligne</MenuItem>
          <MenuItem value="global_discount">Remise globale</MenuItem>
          <MenuItem value="category_tva">TVA par catégorie</MenuItem>
        </TextField>
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField label="Préfixe numéro" value={prefix} onChange={(e) => setPrefix(e.target.value)} sx={{ width: 200 }} />
        <TextField select label="Réinitialisation" value={reset}
          onChange={(e) => setReset(e.target.value)} sx={{ width: 220 }}>
          <MenuItem value="annually">Annuelle</MenuItem>
          <MenuItem value="never">Jamais</MenuItem>
        </TextField>
      </Stack>
      <Box>
        <Button variant="contained" onClick={saveAll}>Enregistrer</Button>
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>TVA par catégorie</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Catégorie</TableCell>
              <TableCell align="right">TVA</TableCell>
              <TableCell align="right" width={120}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell>{cat.nom}</TableCell>
                <TableCell align="right">
                  {editingId === cat.id ? (
                    <TextField select size="small" value={editValue} onChange={(e) => setEditValue(e.target.value)}>
                      {TVA_OPTIONS.map((v) => <MenuItem key={v} value={v}>{v}%</MenuItem>)}
                    </TextField>
                  ) : `${cat.tva_rate}%`}
                </TableCell>
                <TableCell align="right">
                  {editingId === cat.id ? (
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Button size="small" onClick={() => saveCategoryTVA(cat)}>OK</Button>
                      <Button size="small" onClick={() => setEditingId(null)}>X</Button>
                    </Stack>
                  ) : (
                    <IconButton size="small" onClick={() => { setEditingId(cat.id); setEditValue(cat.tva_rate); }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow><TableCell colSpan={3} align="center" sx={{ color: 'text.disabled' }}>Aucune catégorie</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    </Stack>
  );
}

// ── Tab 3: Currencies ─────────────────────────────────────────────────────────
function CurrenciesTab({ onToast }) {
  const dispatch = useDispatch();
  const currencies = useSelector((s) => s.settings.currencies);
  const settings   = useSelector((s) => s.settings.settings);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: '', symbol: '', rate: 1 });

  const openAdd = () => { setEditing(null); setForm({ code: '', symbol: '', rate: 1 }); setOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ code: c.code, symbol: c.symbol, rate: c.rate }); setOpen(true); };

  const save = async () => {
    if (!form.code) { onToast('Code requis', 'error'); return; }
    try {
      const data = { ...form, rate: Number(form.rate) || 1 };
      if (editing) await dispatch(updateCurrencyThunk({ id: editing.id, data: { ...editing, ...data } })).unwrap();
      else         await dispatch(addCurrencyThunk(data)).unwrap();
      setOpen(false);
      onToast('Devise sauvegardée');
    } catch (e) { onToast(e.message, 'error'); }
  };

  const remove = async (c) => {
    if (c.code === 'MAD') return onToast('MAD ne peut pas être supprimé', 'warning');
    try { await dispatch(deleteCurrencyThunk(c.id)).unwrap(); onToast('Supprimé'); }
    catch (e) { onToast(e.message, 'error'); }
  };

  const setDefault = async (c) => {
    try {
      await dispatch(saveSetting({ key: 'default_currency', value: c.code })).unwrap();
      onToast(`${c.code} défini comme devise par défaut`);
    } catch (e) { onToast(e.message, 'error'); }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>Devises</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={openAdd}>Ajouter</Button>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Code</TableCell>
            <TableCell>Symbole</TableCell>
            <TableCell align="right">Taux vs MAD</TableCell>
            <TableCell align="center">Défaut</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {currencies.map((c) => (
            <TableRow key={c.id}>
              <TableCell>{c.code}</TableCell>
              <TableCell>{c.symbol}</TableCell>
              <TableCell align="right">{c.rate}</TableCell>
              <TableCell align="center">
                {settings.default_currency === c.code ? <StarIcon color="warning" fontSize="small" /> : (
                  <Button size="small" onClick={() => setDefault(c)}>Définir</Button>
                )}
              </TableCell>
              <TableCell align="right">
                <IconButton size="small" onClick={() => openEdit(c)}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" disabled={c.code === 'MAD'} onClick={() => remove(c)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {currencies.length === 0 && (
            <TableRow><TableCell colSpan={5} align="center" sx={{ color: 'text.disabled' }}>Aucune devise</TableCell></TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? 'Modifier devise' : 'Ajouter devise'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Code (3 lettres)" value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().slice(0, 4) })} fullWidth />
            <TextField label="Symbole" value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value })} fullWidth />
            <TextField label="Taux vs MAD" type="number" value={form.rate}
              onChange={(e) => setForm({ ...form, rate: e.target.value })} fullWidth
              helperText="1 unité = N MAD" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={save}>Enregistrer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ── Tab 4: Email ──────────────────────────────────────────────────────────────
function EmailTab({ onToast }) {
  const cfg = useMemo(() => ({
    serviceId:  import.meta.env.VITE_EMAILJS_SERVICE_ID  || '(non défini)',
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '(non défini)',
    publicKey:  import.meta.env.VITE_EMAILJS_PUBLIC_KEY  || '(non défini)',
  }), []);

  const handleTest = async () => {
    const target = window.prompt('Email destinataire ?');
    if (!target) return;
    try {
      const { sendInvoiceEmail } = await import('../../services/emailService');
      const res = await sendInvoiceEmail(
        { id: 'TEST', numero: 'TEST-001', total_ttc: 0, devise: 'MAD', client_email: target, client_nom: 'Test' },
        null, {}, 'Test'
      );
      onToast(res.success ? 'Email de test envoyé' : `Échec: ${res.error}`, res.success ? 'success' : 'error');
    } catch (e) { onToast(e.message, 'error'); }
  };

  return (
    <Stack spacing={2} sx={{ maxWidth: 600 }}>
      <Alert severity="info">
        Les identifiants EmailJS sont chargés depuis <code>.env</code>.
        Modifiez le fichier puis redémarrez le serveur Vite.
      </Alert>
      <TextField label="Service ID"  value={cfg.serviceId}  fullWidth disabled />
      <TextField label="Template ID" value={cfg.templateId} fullWidth disabled />
      <TextField label="Public Key"  value={cfg.publicKey}  fullWidth disabled type="password" />
      <Box>
        <Button variant="outlined" onClick={handleTest}>Tester l'envoi</Button>
      </Box>
      <Typography variant="caption" color="text.secondary">
        Documentation: <a href="https://www.emailjs.com" target="_blank" rel="noreferrer">emailjs.com</a>
      </Typography>
    </Stack>
  );
}

// ── Tab 5: Archive ────────────────────────────────────────────────────────────
function ArchiveTab() {
  return (
    <Stack spacing={2} sx={{ maxWidth: 600 }}>
      <Typography variant="body2">
        L'archivage annuel se fait depuis la page <b>Archives</b>.
      </Typography>
      <Button variant="contained" href="/archive">Aller aux archives</Button>
    </Stack>
  );
}
