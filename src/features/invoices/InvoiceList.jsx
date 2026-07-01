import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, InputAdornment, ToggleButtonGroup,
  ToggleButton, Chip, IconButton, Tooltip, Snackbar, Alert, Button,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  Avatar,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Search, Visibility, PictureAsPdf, Edit, Add, Delete as DeleteIcon } from '@mui/icons-material';
import { fetchInvoices, fetchAllInvoices, deleteInvoice } from './invoicesSlice';
import { usePDFGenerator } from '../../hooks/usePDFGenerator';
import { subscribeUsers } from '../../services/firebaseService';
import { OverdueBadge } from './PaymentTracking';

const STATUS_META = {
  draft:     { label: 'Brouillon',   color: 'default' },
  pending:   { label: 'En attente',  color: 'warning' },
  validated: { label: 'Validée',     color: 'success' },
  rejected:  { label: 'Rejetée',     color: 'error' },
  paid:      { label: 'Payée',       color: 'info' },
};

export default function InvoiceList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { invoices, loading } = useSelector((s) => s.invoices);
  const user = useSelector((s) => s.auth.user);
  const isAdmin = user?.role === 'admin';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [usersMap, setUsersMap] = useState({});
  const { generateAndDownload, isGenerating } = usePDFGenerator();

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dispatch(deleteInvoice(deleteTarget.id)).unwrap();
      setToast({ open: true, msg: `Facture ${deleteTarget.numero} supprimée`, severity: 'success' });
      setDeleteTarget(null);
    } catch {
      setToast({ open: true, msg: 'Erreur lors de la suppression', severity: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (isAdmin) dispatch(fetchAllInvoices());
    else dispatch(fetchInvoices(user.uid));
  }, [dispatch, isAdmin, user.uid]);

  useEffect(() => {
    if (!isAdmin) return;
    return subscribeUsers((list) => {
      const map = {};
      list.forEach((u) => { map[u.id] = u; });
      setUsersMap(map);
    });
  }, [isAdmin]);

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const matchStatus = statusFilter === 'all' || inv.statut === statusFilter;
      const matchSearch =
        !search ||
        inv.numero?.toLowerCase().includes(search.toLowerCase()) ||
        inv.client_nom?.toLowerCase().includes(search.toLowerCase());
      const matchFrom = !dateFrom || inv.date_creation >= dateFrom;
      const matchTo = !dateTo || inv.date_creation <= dateTo;
      return matchStatus && matchSearch && matchFrom && matchTo;
    });
  }, [invoices, statusFilter, search, dateFrom, dateTo]);

  const handlePDF = async (invId) => {
    try { await generateAndDownload(invId); }
    catch { setToast({ open: true, msg: 'Erreur génération PDF', severity: 'error' }); }
  };

  const columns = [
    { field: 'numero', headerName: 'Numéro', width: 150 },
    {
      field: 'date_creation',
      headerName: 'Date',
      width: 120,
      renderCell: ({ value }) => value || '—',
    },
    { field: 'client_nom', headerName: 'Client', flex: 1, minWidth: 140 },
    {
      field: 'total_ttc',
      headerName: 'Total TTC',
      width: 140,
      renderCell: ({ row }) =>
        `${Number(row.total_ttc || 0).toFixed(2)} ${row.devise || 'MAD'}`,
    },
    {
      field: 'statut',
      headerName: 'Statut',
      width: 130,
      renderCell: ({ value, row }) => {
        const meta = STATUS_META[value] || { label: value, color: 'default' };
        return (
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip label={meta.label} color={meta.color} size="small" />
            <OverdueBadge invoice={row} />
          </Box>
        );
      },
    },
    ...(isAdmin
      ? [{
          field: 'userId',
          headerName: 'Créé par',
          width: 180,
          renderCell: ({ value }) => {
            const u = usersMap[value];
            const name = u?.displayName || u?.email || value || '—';
            const initials = name !== value && name !== '—'
              ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
              : '?';
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 24, height: 24, fontSize: 11, bgcolor: 'primary.main' }}>
                  {initials}
                </Avatar>
                <Typography noWrap sx={{ fontSize: 13 }}>{name}</Typography>
              </Box>
            );
          },
        }]
      : []),
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      width: 160,
      renderCell: ({ row }) => {
        const canEdit = (row.statut === 'draft' || row.statut === 'rejected') && !isAdmin;
        const canPDF = row.statut === 'validated' || row.statut === 'paid';
        const canDelete = (row.statut === 'draft' || row.statut === 'rejected')
          && !isAdmin && row.userId === user?.uid;
        return (
          <>
            <Tooltip title="Voir">
              <IconButton size="small" onClick={() => navigate(`/invoices/${row.id}`)}>
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
            {canEdit && (
              <Tooltip title="Modifier">
                <IconButton size="small" onClick={() => navigate(`/invoices/${row.id}/edit`)}>
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canPDF && (
              <Tooltip title="Télécharger PDF">
                <span>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handlePDF(row.id)}
                    disabled={isGenerating}
                  >
                    {isGenerating
                      ? <CircularProgress size={16} />
                      : <PictureAsPdf fontSize="small" />}
                  </IconButton>
                </span>
              </Tooltip>
            )}
            {canDelete && (
              <Tooltip title="Supprimer">
                <IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </>
        );
      },
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>Factures</Typography>
        {!isAdmin && (
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/invoices/new')}>
            Nouvelle facture
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, alignItems: 'center' }}>
        <TextField
          placeholder="Numéro ou client…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ width: 240 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          label="Du"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ width: 160 }}
        />
        <TextField
          label="Au"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ width: 160 }}
        />
      </Box>

      <Box sx={{ overflowX: 'auto', mb: 2, pb: 0.5, WebkitOverflowScrolling: 'touch' }}>
        <ToggleButtonGroup
          value={statusFilter}
          exclusive
          onChange={(_, v) => { if (v !== null) setStatusFilter(v); }}
          size="small"
          sx={{ flexWrap: 'nowrap', whiteSpace: 'nowrap' }}
        >
          <ToggleButton value="all">Tous</ToggleButton>
          {Object.entries(STATUS_META).map(([k, v]) => (
            <ToggleButton key={k} value={k}>{v.label}</ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ width: '100%', overflowX: 'auto' }}>
        <DataGrid
          rows={filtered}
          columns={columns}
          loading={loading}
          autoHeight
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
          sx={{ bgcolor: 'background.paper', borderRadius: 2, minWidth: 600 }}
        />
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity}>{toast.msg}</Alert>
      </Snackbar>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        PaperProps={{ sx: { borderRadius: '16px' } }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Supprimer cette facture ?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>Cette action est irréversible.</Alert>
          <Typography sx={{ fontSize: 14, color: '#64748B' }}>
            La facture <strong>{deleteTarget?.numero}</strong> sera définitivement supprimée.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            variant="outlined"
            disabled={deleting}
            sx={{ borderRadius: '8px' }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={deleting}
            sx={{ borderRadius: '8px' }}
          >
            {deleting ? <CircularProgress size={18} color="inherit" /> : 'Supprimer définitivement'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
