import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box, Typography, Paper, Grid, Divider, Chip, Button,
  Table, TableHead, TableRow, TableCell, TableBody,
  Stepper, Step, StepLabel, Alert, CircularProgress,
  Stack, IconButton,
} from '@mui/material';
import {
  ArrowBack, Edit, PictureAsPdf, OpenInNew, MailOutlined,
} from '@mui/icons-material';
import { useInvoiceListener } from '../../hooks/useInvoiceListener';
import { usePDFGenerator } from '../../hooks/usePDFGenerator';
import QRPreview from '../../components/QRPreview';
import ValidationActions from './ValidationActions';
import PaymentTracking, { OverdueBadge } from './PaymentTracking';

const STATUS_META = {
  draft:     { label: 'Brouillon',   color: 'default', step: 0 },
  pending:   { label: 'En attente',  color: 'warning', step: 1 },
  validated: { label: 'Validée',     color: 'success', step: 2 },
  rejected:  { label: 'Rejetée',     color: 'error',   step: 2 },
  paid:      { label: 'Payée',       color: 'info',    step: 3 },
};

const STEPS = ['Brouillon', 'En attente', 'Validée / Rejetée', 'Payée'];

const BILLING_LABELS = {
  simple:          'Simple (TVA 20% fixe)',
  line_discount:   'Remise par ligne',
  global_discount: 'Remise globale',
  category_tva:    'TVA par catégorie',
};

const fmtDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? String(iso) : d.toLocaleString('fr-FR');
};
const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? String(iso) : d.toLocaleDateString('fr-FR');
};

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const isAdmin = user?.role === 'admin';

  const { generateAndDownload, generateAndPreview, isGenerating } = usePDFGenerator();
  const { invoice, loading } = useInvoiceListener(id);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!invoice) return <Alert severity="error">Facture introuvable.</Alert>;

  const meta = STATUS_META[invoice.statut] || { label: invoice.statut, color: 'default', step: 0 };
  const symbol = invoice.devise_symbol || invoice.devise || 'MAD';
  const canEdit = (invoice.statut === 'draft' || invoice.statut === 'rejected') && !isAdmin;
  const canPDF  = invoice.statut === 'validated' || invoice.statut === 'paid';

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <IconButton onClick={() => navigate('/invoices')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" fontWeight={600} sx={{ flex: 1 }}>
          {invoice.numero || 'Facture'}
        </Typography>
        <Chip label={meta.label} color={meta.color} />
        <OverdueBadge invoice={invoice} />
        {invoice.email_sent && (
          <Chip
            icon={<MailOutlined />}
            label="Email envoyé"
            color="success"
            variant="outlined"
            size="small"
          />
        )}
      </Box>

      {/* Status timeline */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stepper activeStep={meta.step} alternativeLabel>
          {STEPS.map((label, idx) => (
            <Step
              key={label}
              completed={
                invoice.statut === 'rejected' && idx === 2
                  ? false
                  : meta.step > idx
              }
            >
              <StepLabel error={invoice.statut === 'rejected' && idx === 2}>
                {invoice.statut === 'rejected' && idx === 2 ? 'Rejetée' : label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Rejection reason */}
      {invoice.statut === 'rejected' && invoice.rejection_reason && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography fontWeight={600}>Motif de rejet :</Typography>
          {invoice.rejection_reason}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Invoice info */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Informations</Typography>
            <Stack spacing={1}>
              <InfoRow label="Numéro" value={invoice.numero} />
              <InfoRow label="Date" value={fmtDate(invoice.date_creation)} />
              <InfoRow label="Méthode" value={BILLING_LABELS[invoice.billing_method] || invoice.billing_method} />
              <InfoRow label="Devise" value={`${invoice.devise} (${symbol})`} />
              {invoice.billing_method === 'global_discount' && (
                <InfoRow label="Remise globale" value={`${invoice.remise_globale || 0} %`} />
              )}
              {invoice.date_depot && (
                <InfoRow label="Soumise le" value={fmtDateTime(invoice.date_depot)} />
              )}
              {invoice.validated_at && (
                <InfoRow label="Validée le" value={fmtDateTime(invoice.validated_at)} />
              )}
              {invoice.rejected_at && (
                <InfoRow label="Rejetée le" value={fmtDateTime(invoice.rejected_at)} />
              )}
              {invoice.email_sent_at && (
                <InfoRow label="Email envoyé le" value={fmtDateTime(invoice.email_sent_at)} />
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Client info + QR */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 3,
                alignItems: { xs: 'stretch', sm: 'flex-start' },
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Client
                </Typography>
                <Stack spacing={1}>
                  <InfoRow label="Nom" value={invoice.client_nom} />
                  <InfoRow label="Email" value={invoice.client_email} />
                  <InfoRow label="Tél." value={invoice.client_tel} />
                  <InfoRow label="Adresse" value={invoice.client_adresse} />
                </Stack>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  flexShrink: 0,
                  alignSelf: { xs: 'center', sm: 'flex-start' },
                }}
              >
                <QRPreview invoice={invoice} size={110} />
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Payment / overdue tracking */}
        {(invoice.statut === 'paid' || ['pending', 'validated'].includes(invoice.statut)) && (
          <Grid size={{ xs: 12 }}>
            <PaymentTracking invoice={invoice} />
          </Grid>
        )}

        {/* Line items */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Lignes de facturation
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.main' }}>
                    {['Désignation', 'Qté', 'Prix unit.', 'Remise', 'TVA %', 'Total ligne'].map((h) => (
                      <TableCell key={h} sx={{ color: 'white' }} align={h === 'Désignation' ? 'left' : 'right'}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(invoice.lignes || []).map((l, i) => (
                    <TableRow key={i} sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                      <TableCell>{l.designation}</TableCell>
                      <TableCell align="right">{l.quantite}</TableCell>
                      <TableCell align="right">{Number(l.prix_unitaire).toFixed(2)} {symbol}</TableCell>
                      <TableCell align="right">{l.remise_ligne || 0} %</TableCell>
                      <TableCell align="right">{l.tva_rate ?? '—'} %</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {Number(l.total_ligne || 0).toFixed(2)} {symbol}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Grid>

        {/* Totals */}
        <Grid size={{ xs: 12, md: 5 }} sx={{ ml: 'auto' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Totaux</Typography>
            <Stack spacing={1}>
              <InfoRow label="Total HT" value={`${Number(invoice.total_ht || 0).toFixed(2)} ${symbol}`} />
              {Number(invoice.remise_globale_montant) > 0 && (
                <InfoRow
                  label={`Remise (${invoice.remise_globale}%)`}
                  value={`−${Number(invoice.remise_globale_montant).toFixed(2)} ${symbol}`}
                  valueColor="error.main"
                />
              )}
              {invoice.tva_breakdown &&
                Object.entries(invoice.tva_breakdown).map(([rate, amount]) => (
                  <InfoRow key={rate} label={`TVA ${rate}%`} value={`${Number(amount).toFixed(2)} ${symbol}`} />
                ))}
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" fontWeight={700}>Total TTC</Typography>
                <Typography variant="h6" fontWeight={700} color="primary">
                  {Number(invoice.total_ttc || 0).toFixed(2)} {symbol}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {invoice.signature_base64 && (
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Signature</Typography>
              <Box
                component="img"
                src={invoice.signature_base64}
                alt="Signature"
                sx={{ maxWidth: '100%', maxHeight: 80, objectFit: 'contain', border: '1px solid #eee', borderRadius: 1 }}
              />
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Action buttons */}
      <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
        {canPDF && (
          <>
            <Button
              variant="outlined"
              startIcon={isGenerating ? <CircularProgress size={16} /> : <PictureAsPdf />}
              onClick={() => generateAndDownload(invoice)}
              disabled={isGenerating}
            >
              Télécharger PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={isGenerating ? <CircularProgress size={16} /> : <OpenInNew />}
              onClick={() => generateAndPreview(invoice)}
              disabled={isGenerating}
            >
              Aperçu PDF
            </Button>
          </>
        )}
        {canEdit && (
          <Button variant="outlined" startIcon={<Edit />} onClick={() => navigate(`/invoices/${id}/edit`)}>
            Modifier
          </Button>
        )}
        <ValidationActions invoice={invoice} />
      </Box>
    </Box>
  );
}

function InfoRow({ label, value, valueColor }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
      <Typography color="text.secondary" noWrap>{label}</Typography>
      <Typography fontWeight={500} color={valueColor || 'text.primary'} sx={{ textAlign: 'right' }}>
        {value || '—'}
      </Typography>
    </Box>
  );
}
