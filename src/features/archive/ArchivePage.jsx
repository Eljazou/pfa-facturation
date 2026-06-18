import { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Paper, Stack, Button, ToggleButtonGroup, ToggleButton,
  Alert, CircularProgress, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar,
  IconButton, Tooltip, TextField, InputAdornment,
} from '@mui/material';
import ArchiveIcon from '@mui/icons-material/Archive';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SearchIcon from '@mui/icons-material/Search';
import {
  archiveYear, getArchivedInvoices, getAvailableArchiveYears, countArchivableForYear,
} from '../../services/archiveService';
import { exportInvoicesToExcel } from '../../services/exportService';
import { formatAmount } from '../../utils/currencyService';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAllInvoices } from '../invoices/invoicesSlice';
import { usePDFGenerator } from '../../hooks/usePDFGenerator';

const STATUS_LABEL = {
  draft: 'Brouillon', pending: 'En attente', validated: 'Validée',
  rejected: 'Rejetée', paid: 'Payée',
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? String(iso) : d.toLocaleDateString('fr-FR');
};

export default function ArchivePage() {
  const dispatch = useDispatch();
  const allInvoices = useSelector((s) => s.invoices.invoices);
  const currencies  = useSelector((s) => s.settings.currencies);
  const { generateAndDownload, generateAndPreview, isGenerating } = usePDFGenerator();

  const currentYear = new Date().getFullYear();
  const [years, setYears]     = useState([currentYear]);
  const [year, setYear]       = useState(currentYear);
  const [list, setList]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiving, setArchiving]     = useState(false);
  const [toast, setToast] = useState(null);
  const [search, setSearch]   = useState('');
  const [pdfLoadingId, setPdfLoadingId] = useState(null);

  const isCurrentYear = year === currentYear;
  const archivableNow = useMemo(
    () => countArchivableForYear(allInvoices, currentYear),
    [allInvoices, currentYear]
  );
  const archivableTotal = archivableNow.reduce((s, i) => s + (Number(i.total_ttc) || 0), 0);

  useEffect(() => { dispatch(fetchAllInvoices()); }, [dispatch]);

  useEffect(() => {
    getAvailableArchiveYears().then((ys) => {
      setYears(Array.from(new Set([currentYear, ...ys])).sort((a, b) => b - a));
    });
  }, [currentYear]);

  useEffect(() => {
    setLoading(true);
    getArchivedInvoices(year)
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [year]);

  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((inv) =>
      (inv.numero || '').toLowerCase().includes(q) ||
      (inv.client_nom || '').toLowerCase().includes(q) ||
      (inv.client_email || '').toLowerCase().includes(q)
    );
  }, [list, search]);

  const totalAmount = filtered.reduce((s, i) => s + (Number(i.total_ttc) || 0), 0);

  const handlePdfDownload = async (inv) => {
    setPdfLoadingId(inv.id);
    try { await generateAndDownload(inv); } catch { /* ignore */ } finally { setPdfLoadingId(null); }
  };

  const handlePdfPreview = async (inv) => {
    setPdfLoadingId(inv.id);
    try { await generateAndPreview(inv); } catch { /* ignore */ } finally { setPdfLoadingId(null); }
  };

  const handleArchive = async () => {
    setArchiving(true);
    try {
      const res = await archiveYear(currentYear);
      setToast({
        msg: `${res.archived_count} factures archivées — Total: ${formatAmount(res.total_amount, 'MAD', currencies)}`,
        severity: 'success',
      });
      setConfirmOpen(false);
      // Refresh
      const ys = await getAvailableArchiveYears();
      setYears(Array.from(new Set([currentYear, ...ys])).sort((a, b) => b - a));
      dispatch(fetchAllInvoices());
      const updated = await getArchivedInvoices(currentYear);
      setList(updated);
    } catch (e) {
      setToast({ msg: e.message || 'Erreur', severity: 'error' });
    } finally {
      setArchiving(false);
    }
  };

  const handleExport = () => {
    exportInvoicesToExcel(list, [], `archive_${year}.xlsx`);
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>Archives</Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} sx={{ mb: 3 }}>
        <ToggleButtonGroup
          exclusive
          value={year}
          onChange={(_, v) => { if (v != null) setYear(v); }}
          size="small"
        >
          {years.map((y) => (
            <ToggleButton key={y} value={y}>{y}{y === currentYear ? ' (en cours)' : ''}</ToggleButton>
          ))}
        </ToggleButtonGroup>
        <TextField
          size="small"
          placeholder="Rechercher (N°, client…)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ width: 240 }}
        />
        <Box sx={{ flex: 1 }} />
        {list.length > 0 && (
          <Button startIcon={<FileDownloadIcon />} variant="outlined" onClick={handleExport}>
            Exporter Excel
          </Button>
        )}
      </Stack>

      {/* Archive panel for current year */}
      {isCurrentYear && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.light' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
            <ArchiveIcon color="warning" sx={{ fontSize: 40 }} />
            <Box sx={{ flex: 1 }}>
              <Typography fontWeight={600}>Archiver l'année {currentYear}</Typography>
              <Typography variant="body2" color="text.secondary">
                {archivableNow.length} facture{archivableNow.length > 1 ? 's' : ''} payée{archivableNow.length > 1 ? 's' : ''}/validée{archivableNow.length > 1 ? 's' : ''} prêtes à être archivées —
                Total {formatAmount(archivableTotal, 'MAD', currencies)}
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="warning"
              disabled={archivableNow.length === 0}
              onClick={() => setConfirmOpen(true)}
              startIcon={<ArchiveIcon />}
            >
              Archiver {currentYear}
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Stats card */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={4}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              {isCurrentYear ? 'Éligibles' : 'Archivées'}
            </Typography>
            <Typography variant="h6" fontWeight={700}>{filtered.length}{filtered.length !== list.length ? ` / ${list.length}` : ''}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Montant total</Typography>
            <Typography variant="h6" fontWeight={700}>{formatAmount(totalAmount, 'MAD', currencies)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Année</Typography>
            <Typography variant="h6" fontWeight={700}>{year}</Typography>
          </Box>
        </Stack>
      </Paper>

      {/* List */}
      <Paper sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <ArchiveIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">
              {search ? 'Aucun résultat pour cette recherche' : `Aucune facture archivée pour ${year}`}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Numéro</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell align="right">Total TTC</TableCell>
                  <TableCell>Statut</TableCell>
                  {!isCurrentYear && <TableCell>Archivée le</TableCell>}
                  <TableCell align="center">PDF</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((inv) => (
                  <TableRow key={inv.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{inv.numero}</TableCell>
                    <TableCell>{fmtDate(inv.date_creation)}</TableCell>
                    <TableCell>{inv.client_nom || '—'}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: 12 }}>{inv.client_email || '—'}</TableCell>
                    <TableCell align="right">{formatAmount(inv.total_ttc, inv.devise || 'MAD', currencies)}</TableCell>
                    <TableCell>
                      <Chip size="small" label={STATUS_LABEL[inv.statut] || inv.statut}
                            color={inv.statut === 'paid' ? 'info' : inv.statut === 'validated' ? 'success' : 'default'} />
                    </TableCell>
                    {!isCurrentYear && (
                      <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{fmtDate(inv.archived_at)}</TableCell>
                    )}
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="Aperçu PDF">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handlePdfPreview(inv)}
                              disabled={pdfLoadingId === inv.id || isGenerating}
                            >
                              {pdfLoadingId === inv.id ? <CircularProgress size={16} /> : <OpenInNewIcon fontSize="small" />}
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Télécharger PDF">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handlePdfDownload(inv)}
                              disabled={pdfLoadingId === inv.id || isGenerating}
                            >
                              <PictureAsPdfIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onClose={() => !archiving && setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirmer l'archivage {currentYear}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Cette action est irréversible. {archivableNow.length} facture{archivableNow.length > 1 ? 's' : ''} payée{archivableNow.length > 1 ? 's' : ''}/validée{archivableNow.length > 1 ? 's' : ''} de {currentYear} sera archivée.
          </Alert>
          <Typography>
            Total montant: <b>{formatAmount(archivableTotal, 'MAD', currencies)}</b>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={archiving}>Annuler</Button>
          <Button onClick={handleArchive} variant="contained" color="warning" disabled={archiving}>
            {archiving ? <CircularProgress size={18} /> : 'Confirmer l\'archivage'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? <Alert severity={toast.severity}>{toast.msg}</Alert> : <span />}
      </Snackbar>
    </Box>
  );
}
