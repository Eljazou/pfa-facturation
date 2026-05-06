import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, TextField, MenuItem, CircularProgress, Stack,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PaidIcon from '@mui/icons-material/Paid';
import SendIcon from '@mui/icons-material/Send';
import { transitionInvoice, getAvailableActions } from '../../services/workflowService';
import { triggerNotification } from '../../services/notificationService';
import { sendInvoiceEmail } from '../../services/emailService';
import { showToast } from '../notifications/toastSlice';
import { getSettings } from '../../services/jsonService';
import { ref as dbRef, update as dbUpdate } from 'firebase/database';
import { db } from '../../config/firebase';

const PAYMENT_TYPES = ['Virement bancaire', 'Chèque', 'Espèces'];

export default function ValidationActions({ invoice, onUpdated }) {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const role = user?.role === 'admin' ? 'admin' : 'user';
  const actions = getAvailableActions(invoice.statut, role);

  const [validateOpen, setValidateOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payType, setPayType] = useState(PAYMENT_TYPES[0]);
  const [payRef, setPayRef] = useState('');
  const [loading, setLoading] = useState(false);

  const reasonError = reason.trim().length > 0 && reason.trim().length < 10;

  const handleSubmit = async () => {
    setLoading(true);
    const res = await transitionInvoice(invoice.id, invoice.statut, 'pending', 'user', user.uid);
    setLoading(false);
    if (!res.success) {
      dispatch(showToast({ message: res.error, severity: 'error' }));
      return;
    }
    // Notify all admins (best-effort: notify by role lookup is out of scope; store under 'admin' bucket)
    try { await triggerNotification('invoice_submitted', { ...invoice, ...res.payload }, 'admin'); } catch { /* ignore */ }
    dispatch(showToast({ message: 'Facture soumise pour validation', severity: 'success' }));
    onUpdated?.(res.payload);
  };

  const handleValidate = async () => {
    setLoading(true);
    const res = await transitionInvoice(invoice.id, invoice.statut, 'validated', 'admin', user.uid);
    if (!res.success) {
      setLoading(false);
      setValidateOpen(false);
      dispatch(showToast({ message: res.error, severity: 'error' }));
      return;
    }

    // Notify creator
    if (invoice.userId) {
      try { await triggerNotification('invoice_validated', { ...invoice, ...res.payload }, invoice.userId); } catch { /* ignore */ }
    }

    // Send email to client (best-effort)
    let emailOk = false;
    let emailError = '';
    try {
      let companyData = {};
      try {
        const settings = await getSettings();
        settings.forEach((s) => { companyData[s.key] = s.value; });
      } catch { /* settings optional */ }

      const emailRes = await sendInvoiceEmail(
        { ...invoice, ...res.payload },
        null,
        companyData,
        user.displayName || ''
      );
      emailOk = emailRes.success;
      emailError = emailRes.error || '';
      if (emailOk) {
        await dbUpdate(dbRef(db, `factures/${invoice.id}`), {
          email_sent: true,
          email_sent_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      emailError = err?.message || 'Erreur inconnue';
      console.warn('Email dispatch failed:', err);
    }

    setLoading(false);
    setValidateOpen(false);
    dispatch(showToast({
      message: emailOk
        ? 'Facture validée et email envoyé au client'
        : `Facture validée — email non envoyé : ${emailError}`,
      severity: emailOk ? 'success' : 'warning',
    }));
    onUpdated?.(res.payload);
  };

  const handleReject = async () => {
    if (reason.trim().length < 10) return;
    setLoading(true);
    const res = await transitionInvoice(invoice.id, invoice.statut, 'rejected', 'admin', user.uid, { reason: reason.trim() });
    setLoading(false);
    setRejectOpen(false);
    if (!res.success) {
      dispatch(showToast({ message: res.error, severity: 'error' }));
      return;
    }
    if (invoice.userId) {
      try {
        await triggerNotification('invoice_rejected', { ...invoice, ...res.payload, rejection_reason: reason.trim() }, invoice.userId);
      } catch { /* ignore */ }
    }
    dispatch(showToast({ message: 'Facture rejetée', severity: 'warning' }));
    setReason('');
    onUpdated?.(res.payload);
  };

  const handleMarkPaid = async () => {
    setLoading(true);
    const res = await transitionInvoice(invoice.id, invoice.statut, 'paid', 'user', user.uid, {
      date: new Date(payDate).toISOString(),
      type: payType,
      reference: payRef.trim(),
    });
    setLoading(false);
    setPayOpen(false);
    if (!res.success) {
      dispatch(showToast({ message: res.error, severity: 'error' }));
      return;
    }
    try { await triggerNotification('invoice_paid', { ...invoice, ...res.payload }, 'admin'); } catch { /* ignore */ }
    dispatch(showToast({ message: 'Facture marquée comme payée', severity: 'success' }));
    onUpdated?.(res.payload);
  };

  return (
    <>
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        {actions.includes('submit') && (
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
            onClick={handleSubmit}
            disabled={loading}
          >
            Soumettre
          </Button>
        )}
        {actions.includes('validate') && (
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => setValidateOpen(true)}
            disabled={loading}
          >
            Valider la facture
          </Button>
        )}
        {actions.includes('reject') && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => setRejectOpen(true)}
            disabled={loading}
          >
            Rejeter
          </Button>
        )}
        {actions.includes('mark_paid') && (
          <Button
            variant="contained"
            color="info"
            startIcon={<PaidIcon />}
            onClick={() => setPayOpen(true)}
            disabled={loading}
          >
            Marquer comme payée
          </Button>
        )}
      </Stack>

      {/* Validate confirm */}
      <Dialog open={validateOpen} onClose={() => !loading && setValidateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirmer la validation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Confirmer la validation de la facture <b>{invoice.numero}</b> ?
          </DialogContentText>
          <DialogContentText sx={{ mt: 1 }}>
            Un email sera automatiquement envoyé au client.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setValidateOpen(false)} disabled={loading}>Annuler</Button>
          <Button onClick={handleValidate} variant="contained" color="success" disabled={loading}>
            {loading ? <CircularProgress size={18} /> : 'Confirmer et envoyer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onClose={() => !loading && setRejectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Motif du rejet</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            label="Motif du rejet (obligatoire)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            error={reasonError}
            helperText={reasonError ? 'Minimum 10 caractères' : `${reason.trim().length}/10`}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)} disabled={loading}>Annuler</Button>
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
            disabled={loading || reason.trim().length < 10}
          >
            {loading ? <CircularProgress size={18} /> : 'Rejeter'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mark paid dialog */}
      <Dialog open={payOpen} onClose={() => !loading && setPayOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Marquer comme payée</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              type="date"
              label="Date d'encaissement"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <TextField
              select
              label="Type de paiement"
              value={payType}
              onChange={(e) => setPayType(e.target.value)}
              fullWidth
            >
              {PAYMENT_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField
              label="Référence (optionnel)"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              fullWidth
              placeholder="Ex: VIR-20260507-001"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayOpen(false)} disabled={loading}>Annuler</Button>
          <Button onClick={handleMarkPaid} variant="contained" color="info" disabled={loading || !payDate}>
            {loading ? <CircularProgress size={18} /> : 'Confirmer'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
