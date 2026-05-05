import { Alert, Box, Chip, Paper, Stack, Typography } from '@mui/material';
import PaidIcon from '@mui/icons-material/Paid';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { computeOverdueStatus } from '../../services/dashboardService';

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? String(iso) : d.toLocaleDateString('fr-FR');
};

function daysBetween(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  if (isNaN(da.getTime()) || isNaN(db.getTime())) return null;
  return Math.max(0, Math.round((db.getTime() - da.getTime()) / 86_400_000));
}

export function OverdueBadge({ invoice, size = 'small' }) {
  const { isOverdue, daysOverdue } = computeOverdueStatus(invoice);
  if (!isOverdue) return null;
  return (
    <Chip
      icon={<WarningAmberIcon />}
      label={`En retard de ${daysOverdue} jour${daysOverdue > 1 ? 's' : ''}`}
      color="error"
      size={size}
      variant="outlined"
    />
  );
}

export default function PaymentTracking({ invoice }) {
  if (!invoice) return null;

  const { isOverdue, daysOverdue } = computeOverdueStatus(invoice);

  if (invoice.statut === 'paid') {
    const days = daysBetween(invoice.date_depot || invoice.date_creation, invoice.date_encaissement);
    return (
      <Paper sx={{ p: 0, overflow: 'hidden' }}>
        <Alert
          severity="success"
          icon={<PaidIcon />}
          sx={{ borderRadius: 0, '& .MuiAlert-message': { width: '100%' } }}
        >
          <Typography fontWeight={600}>
            Facture payée le {fmtDate(invoice.date_encaissement)}
            {days != null && ` — payée en ${days} jour${days > 1 ? 's' : ''}`}
          </Typography>
        </Alert>
        <Box sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
            <Field label="Date d'encaissement" value={fmtDate(invoice.date_encaissement)} />
            <Field label="Type de paiement"    value={invoice.type_virement || '—'} />
            {invoice.reference_paiement && (
              <Field label="Référence" value={invoice.reference_paiement} />
            )}
            {invoice.date_depot && (
              <Field label="Soumise le" value={fmtDate(invoice.date_depot)} />
            )}
          </Stack>
        </Box>
      </Paper>
    );
  }

  if (isOverdue) {
    return (
      <Alert severity="error" icon={<WarningAmberIcon />}>
        <Typography fontWeight={600}>
          Facture en retard de {daysOverdue} jour{daysOverdue > 1 ? 's' : ''}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Soumise le {fmtDate(invoice.date_depot || invoice.date_creation)} (délai 30 jours).
        </Typography>
      </Alert>
    );
  }

  return null;
}

function Field({ label, value }) {
  return (
    <Box sx={{ minWidth: 140 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={500}>{value}</Typography>
    </Box>
  );
}
