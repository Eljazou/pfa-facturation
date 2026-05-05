import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box, Grid, Typography, Button, IconButton, TextField,
  Select, MenuItem, FormControl, InputLabel, Autocomplete,
  Paper, Divider, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, Stack, Chip,
} from '@mui/material';
import { Add, Delete, Save, Send, ArrowBack, Draw, Clear } from '@mui/icons-material';
import { calculateLine, calculateInvoice } from '../../utils/billingEngine';
import { createInvoice, updateInvoice, fetchInvoices } from './invoicesSlice';
import { getClients, getInvoice } from '../../services/firebaseService';
import { getArticles, getCategories, getCurrencies } from '../../services/jsonService';
import SignaturePad from '../../components/SignaturePad';
import QRPreview from '../../components/QRPreview';

const METHODS = [
  { value: 'simple',          label: 'Simple (TVA 20% fixe)' },
  { value: 'line_discount',   label: 'Remise par ligne' },
  { value: 'global_discount', label: 'Remise globale' },
  { value: 'category_tva',    label: 'TVA par catégorie' },
];

const emptyLine = () => ({
  article_id: '', designation: '', prix_unitaire: 0, quantite: 1,
  remise_ligne: 0, categorie_id: null,
});

const schema = Yup.object({
  client_id:      Yup.string().required('Client requis'),
  billing_method: Yup.string().required(),
  devise:         Yup.string().required(),
  remise_globale: Yup.number().min(0, 'Min 0').max(100, 'Max 100'),
  date_creation:  Yup.string().required('Date requise'),
  lignes: Yup.array()
    .of(
      Yup.object({
        article_id:    Yup.string().required('Article requis'),
        quantite:      Yup.number().min(1, 'Min 1').required('Qté requise'),
        prix_unitaire: Yup.number().min(0).required(),
      })
    )
    .min(1, 'Au moins une ligne requise'),
});

export default function InvoiceForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);

  const [clients,     setClients]     = useState([]);
  const [articles,    setArticles]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [currencies,  setCurrencies]  = useState([]);
  const [editInvoice, setEditInvoice] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [sigDialog,    setSigDialog]    = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [cls, arts, cats, curs] = await Promise.all([
          getClients(user.uid),
          getArticles(),
          getCategories(),
          getCurrencies(),
        ]);
        setClients(cls);
        setArticles(arts);
        setCategories(cats);
        setCurrencies(curs);
        if (isEdit) {
          const inv = await getInvoice(id);
          setEditInvoice(inv);
        }
      } finally {
        setDataLoading(false);
      }
    };
    dispatch(fetchInvoices(user.uid));
    load();
  }, [user.uid, id, isEdit, dispatch]);

  const categoryTVARates = useMemo(() => {
    const map = {};
    categories.forEach((c) => { map[c.id] = c.tva_rate; });
    return map;
  }, [categories]);

  const today = new Date().toISOString().split('T')[0];

  const initialValues = useMemo(() => {
    if (isEdit && editInvoice) {
      return {
        client_id:       editInvoice.client_id       || '',
        billing_method:  editInvoice.billing_method  || 'simple',
        devise:          editInvoice.devise           || 'MAD',
        remise_globale:  editInvoice.remise_globale   || 0,
        date_creation:   editInvoice.date_creation    || today,
        lignes:          editInvoice.lignes?.length   ? editInvoice.lignes : [emptyLine()],
        signature_base64: editInvoice.signature_base64 || '',
      };
    }
    return {
      client_id: '', billing_method: 'simple', devise: 'MAD',
      remise_globale: 0, date_creation: today,
      lignes: [emptyLine()], signature_base64: '',
    };
  }, [isEdit, editInvoice, today]);

  const formik = useFormik({
    initialValues,
    validationSchema: schema,
    enableReinitialize: true,
    onSubmit: () => {},
  });

  const totals = useMemo(
    () => calculateInvoice(
      formik.values.lignes,
      formik.values.billing_method,
      Number(formik.values.remise_globale || 0),
      categoryTVARates
    ),
    [formik.values.lignes, formik.values.billing_method, formik.values.remise_globale, categoryTVARates]
  );

  const selectedClient   = clients.find((c) => c.id === formik.values.client_id);
  const selectedCurrency = currencies.find((c) => c.code === formik.values.devise);
  const symbol           = selectedCurrency?.symbol || formik.values.devise;

  // Preview object for QRPreview (not yet saved)
  const previewInvoice = useMemo(() => ({
    numero:     isEdit ? editInvoice?.numero : 'FAC-PREVIEW',
    total_ttc:  totals.total_ttc,
    client_nom: selectedClient?.nom || '',
  }), [isEdit, editInvoice, totals.total_ttc, selectedClient]);

  const setLineField = (idx, field, value) => {
    const lines = formik.values.lignes.map((l, i) =>
      i === idx ? { ...l, [field]: value } : l
    );
    formik.setFieldValue('lignes', lines);
  };

  const handleArticleSelect = (idx, article) => {
    if (!article) return;
    const lines = formik.values.lignes.map((l, i) =>
      i === idx
        ? {
            ...l,
            article_id:    String(article.id),
            designation:   article.designation,
            prix_unitaire: article.prix_unitaire,
            categorie_id:  article.categorie_id,
          }
        : l
    );
    formik.setFieldValue('lignes', lines);
  };

  const addLine    = () => formik.setFieldValue('lignes', [...formik.values.lignes, emptyLine()]);
  const removeLine = (idx) =>
    formik.setFieldValue('lignes', formik.values.lignes.filter((_, i) => i !== idx));

  const handleSave = async (statut) => {
    const errors = await formik.validateForm();
    if (Object.keys(errors).length > 0) {
      formik.setTouched(
        Object.fromEntries(
          Object.keys(errors).map((k) => [k, true])
        )
      );
      return;
    }
    setSubmitting(true);
    try {
      // Enrich each line with computed fields for PDF
      const enrichedLignes = formik.values.lignes.map((l) => {
        const computed = calculateLine(l, formik.values.billing_method, categoryTVARates);
        return { ...l, ...computed };
      });

      const data = {
        ...formik.values,
        lignes:                enrichedLignes,
        userId:                user.uid,
        statut,
        total_ht:              totals.total_ht,
        remise_globale_montant: totals.remise_globale_montant,
        total_ht_after_remise: totals.total_ht_after_remise,
        tva_montant:           totals.tva_montant,
        tva_breakdown:         totals.tva_breakdown,
        total_ttc:             totals.total_ttc,
        client_nom:            selectedClient?.nom     || '',
        client_email:          selectedClient?.email   || '',
        client_tel:            selectedClient?.tel     || '',
        client_adresse:        selectedClient?.adresse || '',
        devise_symbol:         symbol,
        signature_base64:      formik.values.signature_base64 || null,
      };

      if (isEdit) {
        await dispatch(updateInvoice({ id, data })).unwrap();
      } else {
        await dispatch(createInvoice(data)).unwrap();
      }
      navigate('/invoices');
    } catch (err) {
      setToast(err?.message || 'Erreur lors de la sauvegarde');
      setSubmitting(false);
    }
  };

  if (dataLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const { values, errors, touched } = formik;
  const showRemise     = values.billing_method === 'global_discount';
  const showLineRemise = values.billing_method === 'line_discount';

  return (
    <Box component="form" noValidate>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
        <IconButton onClick={() => (formik.dirty ? setCancelDialog(true) : navigate('/invoices'))}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" fontWeight={600}>
          {isEdit ? `Modifier — ${editInvoice?.numero}` : 'Nouvelle facture'}
        </Typography>
      </Box>

      {toast && (
        <Alert severity="error" onClose={() => setToast(null)} sx={{ mb: 2 }}>
          {toast}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* ── Left: form fields ─────────────────────────────────────────── */}
        <Grid item xs={12} md={8}>
          {/* General info */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Informations générales
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Autocomplete
                  options={clients}
                  getOptionLabel={(c) => `${c.nom} — ${c.email}`}
                  value={clients.find((c) => c.id === values.client_id) || null}
                  onChange={(_, c) => formik.setFieldValue('client_id', c?.id || '')}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Client *"
                      error={touched.client_id && !!errors.client_id}
                      helperText={touched.client_id && errors.client_id}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Méthode de facturation</InputLabel>
                  <Select
                    name="billing_method"
                    value={values.billing_method}
                    label="Méthode de facturation"
                    onChange={formik.handleChange}
                  >
                    {METHODS.map((m) => (
                      <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Devise</InputLabel>
                  <Select
                    name="devise"
                    value={values.devise}
                    label="Devise"
                    onChange={formik.handleChange}
                  >
                    {currencies.map((c) => (
                      <MenuItem key={c.code} value={c.code}>
                        {c.code} ({c.symbol})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  label="Date *"
                  name="date_creation"
                  type="date"
                  value={values.date_creation}
                  onChange={formik.handleChange}
                  error={touched.date_creation && !!errors.date_creation}
                  helperText={touched.date_creation && errors.date_creation}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>

              {showRemise && (
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Remise globale (%)"
                    name="remise_globale"
                    type="number"
                    value={values.remise_globale}
                    onChange={formik.handleChange}
                    error={touched.remise_globale && !!errors.remise_globale}
                    helperText={touched.remise_globale && errors.remise_globale}
                    inputProps={{ min: 0, max: 100, step: 0.5 }}
                    fullWidth
                  />
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Line items */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Lignes de facturation
            </Typography>

            {touched.lignes && typeof errors.lignes === 'string' && (
              <Alert severity="error" sx={{ mb: 2 }}>{errors.lignes}</Alert>
            )}

            <Stack spacing={2}>
              {values.lignes.map((ligne, idx) => {
                const computed    = calculateLine(ligne, values.billing_method, categoryTVARates);
                const lineErrors  = errors.lignes?.[idx] || {};
                const lineTouched = touched.lignes?.[idx] || {};

                return (
                  <Paper key={idx} variant="outlined" sx={{ p: 2 }}>
                    <Grid container spacing={1.5} alignItems="flex-start">
                      {/* Article */}
                      <Grid item xs={12} sm={showLineRemise ? 4 : 5}>
                        <Autocomplete
                          options={articles}
                          getOptionLabel={(a) => `${a.designation} — ${a.prix_unitaire} MAD`}
                          value={articles.find((a) => String(a.id) === ligne.article_id) || null}
                          onChange={(_, a) => handleArticleSelect(idx, a)}
                          isOptionEqualToValue={(o, v) => String(o.id) === String(v.id)}
                          size="small"
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Article *"
                              error={lineTouched.article_id && !!lineErrors.article_id}
                              helperText={lineTouched.article_id && lineErrors.article_id}
                            />
                          )}
                        />
                      </Grid>

                      {/* Quantité */}
                      <Grid item xs={4} sm={2}>
                        <TextField
                          label="Qté *"
                          type="number"
                          value={ligne.quantite}
                          onChange={(e) => setLineField(idx, 'quantite', Number(e.target.value))}
                          error={lineTouched.quantite && !!lineErrors.quantite}
                          helperText={lineTouched.quantite && lineErrors.quantite}
                          inputProps={{ min: 1 }}
                          size="small"
                          fullWidth
                        />
                      </Grid>

                      {/* Prix unitaire */}
                      <Grid item xs={4} sm={2}>
                        <TextField
                          label="Prix unit."
                          type="number"
                          value={ligne.prix_unitaire}
                          onChange={(e) => setLineField(idx, 'prix_unitaire', Number(e.target.value))}
                          inputProps={{ min: 0, step: 0.01 }}
                          size="small"
                          fullWidth
                        />
                      </Grid>

                      {/* Remise ligne (conditional) */}
                      {showLineRemise && (
                        <Grid item xs={4} sm={2}>
                          <TextField
                            label="Remise %"
                            type="number"
                            value={ligne.remise_ligne}
                            onChange={(e) => setLineField(idx, 'remise_ligne', Number(e.target.value))}
                            inputProps={{ min: 0, max: 100 }}
                            size="small"
                            fullWidth
                          />
                        </Grid>
                      )}

                      {/* Sous-total */}
                      <Grid item xs={4} sm={showLineRemise ? 1.5 : 2.5}>
                        <TextField
                          label="Sous-total"
                          value={`${computed.total_ligne.toFixed(2)} ${symbol}`}
                          InputProps={{ readOnly: true }}
                          size="small"
                          fullWidth
                          sx={{ '& input': { color: 'primary.main', fontWeight: 600 } }}
                        />
                      </Grid>

                      {/* Delete */}
                      <Grid item xs="auto" sx={{ display: 'flex', alignItems: 'center', pt: 0.5 }}>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => removeLine(idx)}
                          disabled={values.lignes.length === 1}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Paper>
                );
              })}
            </Stack>

            <Button
              startIcon={<Add />}
              onClick={addLine}
              sx={{ mt: 2 }}
              variant="outlined"
              size="small"
            >
              Ajouter une ligne
            </Button>
          </Paper>
        </Grid>

        {/* ── Right: totals + signature ──────────────────────────────────── */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 80 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Récapitulatif
            </Typography>

            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Total HT</Typography>
                <Typography fontWeight={500}>
                  {totals.total_ht.toFixed(2)} {symbol}
                </Typography>
              </Box>

              {totals.remise_globale_montant > 0 && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography color="text.secondary">
                      Remise ({values.remise_globale}%)
                    </Typography>
                    <Typography color="error.main">
                      −{totals.remise_globale_montant.toFixed(2)} {symbol}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography color="text.secondary">HT après remise</Typography>
                    <Typography>{totals.total_ht_after_remise.toFixed(2)} {symbol}</Typography>
                  </Box>
                </>
              )}

              <Divider />

              {Object.entries(totals.tva_breakdown).map(([rate, amount]) => (
                <Box key={rate} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">TVA {rate}%</Typography>
                  <Typography>{Number(amount).toFixed(2)} {symbol}</Typography>
                </Box>
              ))}

              <Divider />

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" fontWeight={700}>Total TTC</Typography>
                <Typography variant="h6" fontWeight={700} color="primary">
                  {totals.total_ttc.toFixed(2)} {symbol}
                </Typography>
              </Box>
            </Stack>

            {/* QR Preview */}
            {(selectedClient || isEdit) && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <QRPreview invoice={previewInvoice} size={90} />
                </Box>
              </>
            )}

            {/* Signature section */}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Signature
            </Typography>

            {values.signature_base64 ? (
              <Box>
                <Box
                  component="img"
                  src={values.signature_base64}
                  alt="Signature"
                  sx={{
                    width: '100%',
                    maxHeight: 70,
                    objectFit: 'contain',
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    bgcolor: '#fafafa',
                    mb: 1,
                  }}
                />
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Draw />}
                    onClick={() => setSigDialog(true)}
                    fullWidth
                  >
                    Modifier
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    startIcon={<Clear />}
                    onClick={() => formik.setFieldValue('signature_base64', '')}
                  >
                    Supprimer
                  </Button>
                </Stack>
              </Box>
            ) : (
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Draw />}
                onClick={() => setSigDialog(true)}
              >
                Signer la facture
              </Button>
            )}

            <Divider sx={{ my: 2 }} />

            <Stack spacing={1.5}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={submitting ? <CircularProgress size={16} /> : <Save />}
                onClick={() => handleSave('draft')}
                disabled={submitting}
              >
                Enregistrer brouillon
              </Button>
              <Button
                fullWidth
                variant="contained"
                startIcon={submitting ? <CircularProgress size={16} /> : <Send />}
                onClick={() => handleSave('pending')}
                disabled={submitting}
              >
                Soumettre pour validation
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Signature dialog */}
      <SignaturePad
        open={sigDialog}
        onClose={() => setSigDialog(false)}
        onSave={(dataURL) => formik.setFieldValue('signature_base64', dataURL)}
      />

      {/* Cancel confirmation */}
      <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)}>
        <DialogTitle>Annuler la saisie ?</DialogTitle>
        <DialogContent>Les modifications non sauvegardées seront perdues.</DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog(false)}>Continuer</Button>
          <Button color="error" onClick={() => navigate('/invoices')}>Quitter</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
