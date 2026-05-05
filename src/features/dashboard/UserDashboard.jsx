import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Paper, Typography, Skeleton, Button, Stack,
  Table, TableHead, TableBody, TableRow, TableCell, Chip, Link as MuiLink,
  CircularProgress,
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { fetchInvoices } from '../invoices/invoicesSlice';
import {
  computeUserKPIs, buildStatusDistributionData, buildMonthlyTrendData,
  filterInvoices, countOverdue,
} from '../../services/dashboardService';
import { exportInvoicesToExcel } from '../../services/exportService';
import { formatAmount } from '../../utils/format';
import KPICard from '../../components/KPICard';
import DashboardFilters from '../../components/DashboardFilters';

const StatusPieChart = lazy(() => import('../../components/charts/StatusPieChart'));
const TrendLineChart = lazy(() => import('../../components/charts/TrendLineChart'));

const STATUS_META = {
  draft:     { label: 'Brouillon',  color: 'default' },
  pending:   { label: 'En attente', color: 'warning' },
  validated: { label: 'Validée',    color: 'success' },
  rejected:  { label: 'Rejetée',    color: 'error' },
  paid:      { label: 'Payée',      color: 'info' },
};

const TREND_LINES = [
  { key: 'created',   label: 'Créées',    color: '#1976d2' },
  { key: 'validated', label: 'Validées',  color: '#1E7145' },
  { key: 'rejected',  label: 'Rejetées',  color: '#C00000' },
];

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? String(iso) : d.toLocaleDateString('fr-FR');
};

export default function UserDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const { invoices, loading } = useSelector((s) => s.invoices);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    if (user?.uid) dispatch(fetchInvoices(user.uid));
  }, [dispatch, user?.uid]);

  const myInvoices = useMemo(
    () => invoices.filter((i) => i.userId === user?.uid),
    [invoices, user?.uid]
  );

  const filtered = useMemo(() => filterInvoices(myInvoices, filters), [myInvoices, filters]);

  const kpis        = useMemo(() => computeUserKPIs(filtered, user?.uid), [filtered, user?.uid]);
  const statusData  = useMemo(() => buildStatusDistributionData(filtered), [filtered]);
  const trendData   = useMemo(() => buildMonthlyTrendData(filtered, 6),    [filtered]);
  const overdue     = useMemo(() => countOverdue(filtered), [filtered]);

  const recent = useMemo(
    () => [...filtered].sort((a, b) => (b.date_creation || '').localeCompare(a.date_creation || '')).slice(0, 5),
    [filtered]
  );

  const devise = filters.devise || 'MAD';
  const isEmpty = !loading && myInvoices.length === 0;

  const handleExport = () => {
    exportInvoicesToExcel(filtered, [], `mes_factures_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (isEmpty) {
    return (
      <Box sx={{ textAlign: 'center', mt: 8 }}>
        <ReceiptIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" gutterBottom>Aucune facture pour l'instant</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Commencez par créer votre première facture.
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/invoices/new')}>
          Créer votre première facture
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
        Bonjour, {user?.displayName || 'Comptable'}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Voici l'aperçu de votre activité.
      </Typography>

      <DashboardFilters onChange={setFilters} onExport={handleExport} />

      {/* KPI row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Total Factures" value={kpis.total_factures} icon={ReceiptIcon} color="#1976d2" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Montant Encaissé"
            value={formatAmount(kpis.montant_encaisse, devise)}
            icon={AccountBalanceIcon}
            color="#1E7145"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="En Attente"
            value={kpis.total_en_attente}
            subtitle={formatAmount(kpis.montant_en_attente, devise)}
            icon={HourglassEmptyIcon}
            color="#C55A00"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Rejetées" value={kpis.total_rejetees} icon={CancelIcon} color="#C00000" loading={loading} />
        </Grid>
        {overdue > 0 && (
          <Grid item xs={12} sm={6} md={3}>
            <KPICard title="En retard (>30j)" value={overdue} icon={WarningAmberIcon} color="#C00000" loading={loading} />
          </Grid>
        )}
      </Grid>

      {/* Recent table + Status donut */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>Factures récentes</Typography>
              <MuiLink component="button" onClick={() => navigate('/invoices')} underline="hover">
                Voir toutes
              </MuiLink>
            </Stack>
            {loading ? (
              <Skeleton variant="rounded" height={220} />
            ) : recent.length === 0 ? (
              <Typography color="text.disabled" sx={{ py: 4, textAlign: 'center' }}>Aucune facture</Typography>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Numéro</TableCell>
                      <TableCell>Client</TableCell>
                      <TableCell align="right">Total TTC</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recent.map((inv) => {
                      const meta = STATUS_META[inv.statut] || { label: inv.statut, color: 'default' };
                      return (
                        <TableRow
                          key={inv.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/invoices/${inv.id}`)}
                        >
                          <TableCell>{inv.numero}</TableCell>
                          <TableCell>{inv.client_nom || '—'}</TableCell>
                          <TableCell align="right">{formatAmount(inv.total_ttc, inv.devise || devise)}</TableCell>
                          <TableCell><Chip label={meta.label} color={meta.color} size="small" /></TableCell>
                          <TableCell>{fmtDate(inv.date_creation)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Répartition par statut</Typography>
            <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>}>
              <StatusPieChart data={statusData} size={260} />
            </Suspense>
          </Paper>
        </Grid>
      </Grid>

      {/* Trend chart */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Évolution mensuelle (6 derniers mois)
        </Typography>
        <Suspense fallback={<Skeleton variant="rounded" height={280} />}>
          <TrendLineChart data={trendData} lines={TREND_LINES} height={280} />
        </Suspense>
      </Paper>
    </Box>
  );
}
