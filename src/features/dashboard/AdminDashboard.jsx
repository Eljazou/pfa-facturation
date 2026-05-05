import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Paper, Typography, Stack, Skeleton, Button, MenuItem, TextField,
  Table, TableHead, TableBody, TableRow, TableCell, Chip, Avatar, List, ListItem,
  ListItemAvatar, ListItemText, Divider, CircularProgress,
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import VerifiedIcon from '@mui/icons-material/Verified';
import PeopleIcon from '@mui/icons-material/People';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { fetchAllInvoices } from '../invoices/invoicesSlice';
import {
  computeAdminKPIs, buildMonthlyRevenueData, buildStatusDistributionData,
  buildTopClientsData, buildRecentActivity, filterInvoices, countOverdue,
} from '../../services/dashboardService';
import { exportInvoicesToExcel, exportKPIsToExcel } from '../../services/exportService';
import { formatAmount, formatPercent } from '../../utils/format';
import KPICard from '../../components/KPICard';
import DashboardFilters from '../../components/DashboardFilters';

const MonthlyRevenueChart = lazy(() => import('../../components/charts/MonthlyRevenueChart'));
const StatusPieChart      = lazy(() => import('../../components/charts/StatusPieChart'));
const TopClientsChart     = lazy(() => import('../../components/charts/TopClientsChart'));

const STATUS_META = {
  draft:     { label: 'Brouillon',  color: 'default' },
  pending:   { label: 'En attente', color: 'warning' },
  validated: { label: 'Validée',    color: 'success' },
  rejected:  { label: 'Rejetée',    color: 'error' },
  paid:      { label: 'Payée',      color: 'info' },
};

const ACTIVITY_LABEL = {
  created:   { text: 'créée',    color: 'default' },
  submitted: { text: 'soumise',  color: 'warning' },
  validated: { text: 'validée',  color: 'success' },
  rejected:  { text: 'rejetée',  color: 'error' },
  paid:      { text: 'payée',    color: 'info' },
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? String(iso) : d.toLocaleDateString('fr-FR');
};

const fmtRel = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)   return "à l'instant";
  if (m < 60)  return `il y a ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30)  return `il y a ${d}j`;
  return fmtDate(iso);
};

const initials = (s) => (s ? String(s).slice(0, 2).toUpperCase() : 'U');

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { invoices, loading } = useSelector((s) => s.invoices);
  const [filters, setFilters] = useState({});
  const [year, setYear]       = useState(new Date().getFullYear());

  useEffect(() => { dispatch(fetchAllInvoices()); }, [dispatch]);

  const filtered = useMemo(() => filterInvoices(invoices, filters), [invoices, filters]);

  const kpis           = useMemo(() => computeAdminKPIs(filtered), [filtered]);
  const overdue        = useMemo(() => countOverdue(filtered),     [filtered]);
  const monthlyRev     = useMemo(() => buildMonthlyRevenueData(filtered, year), [filtered, year]);
  const statusData     = useMemo(() => buildStatusDistributionData(filtered),    [filtered]);
  const topClients     = useMemo(() => buildTopClientsData(filtered, [], 5),     [filtered]);
  const activity       = useMemo(() => buildRecentActivity(filtered, 10),        [filtered]);
  const pendingList    = useMemo(() => filtered.filter((i) => i.statut === 'pending'), [filtered]);

  const agents = useMemo(() => {
    const ids = new Set(invoices.map((i) => i.userId).filter(Boolean));
    return Array.from(ids).map((id) => ({ id, label: id.slice(0, 8) }));
  }, [invoices]);

  const yearOptions = useMemo(() => {
    const ys = new Set([year]);
    invoices.forEach((i) => {
      const d = i.date_creation ? new Date(i.date_creation) : null;
      if (d && !isNaN(d.getTime())) ys.add(d.getFullYear());
    });
    return Array.from(ys).sort((a, b) => b - a);
  }, [invoices, year]);

  const devise = filters.devise || 'MAD';

  const handleExport      = () => exportInvoicesToExcel(filtered, [], `factures_${new Date().toISOString().slice(0, 10)}.xlsx`);
  const handleExportKPIs  = () => exportKPIsToExcel(kpis, { year }, `rapport_${year}.xlsx`);

  const validationColor = kpis.taux_validation >= 80 ? '#1E7145' : kpis.taux_validation >= 50 ? '#C55A00' : '#C00000';

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ mb: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={600}>Tableau de bord — Administrateur</Typography>
          <Typography color="text.secondary">Vue agrégée de l'activité de tous les agents.</Typography>
        </Box>
        <Button startIcon={<FileDownloadIcon />} variant="outlined" onClick={handleExportKPIs} sx={{ mt: { xs: 2, sm: 0 } }}>
          Exporter le rapport
        </Button>
      </Stack>

      <DashboardFilters
        onChange={setFilters}
        onExport={handleExport}
        agents={agents}
        showAgentFilter
      />

      {/* Row 1 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Total Factures" value={kpis.total_factures} icon={ReceiptIcon} color="#1976d2" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Montant Total Encaissé" value={formatAmount(kpis.montant_encaisse, devise)} icon={AccountBalanceIcon} color="#1E7145" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Box onClick={() => navigate('/invoices')} sx={{ cursor: 'pointer' }}>
            <KPICard title="Factures En Attente" value={kpis.total_en_attente} icon={HourglassEmptyIcon} color="#C55A00" subtitle="Cliquer pour voir la liste" loading={loading} />
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Taux de Validation" value={formatPercent(kpis.taux_validation)} icon={VerifiedIcon} color={validationColor} loading={loading} />
        </Grid>
      </Grid>

      {/* Row 2 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Clients Actifs" value={kpis.total_clients_actifs} icon={PeopleIcon} color="#7B1FA2" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Nombre d'Agents" value={kpis.total_agents} icon={SupervisorAccountIcon} color="#00838F" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Montant Moyen / Facture" value={formatAmount(kpis.moyenne_facture, devise)} icon={TrendingUpIcon} color="#1976d2" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Factures Rejetées" value={kpis.total_rejetees} subtitle={formatPercent(kpis.taux_rejet)} icon={CancelIcon} color="#C00000" loading={loading} />
        </Grid>
        {overdue > 0 && (
          <Grid item xs={12} sm={6} md={3}>
            <KPICard title="En retard (>30j)" value={overdue} icon={WarningAmberIcon} color="#C00000" loading={loading} />
          </Grid>
        )}
      </Grid>

      {/* Row 3 — Revenue + Status */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>Revenu mensuel</Typography>
              <TextField
                select
                size="small"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                sx={{ width: 110 }}
              >
                {yearOptions.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </TextField>
            </Stack>
            <Suspense fallback={<Skeleton variant="rounded" height={320} />}>
              <MonthlyRevenueChart data={monthlyRev} currency={devise} height={320} />
            </Suspense>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Répartition par statut</Typography>
            <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>}>
              <StatusPieChart data={statusData} size={300} />
            </Suspense>
          </Paper>
        </Grid>
      </Grid>

      {/* Row 4 — Top clients + Recent activity */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Top 5 Clients</Typography>
            {topClients.length === 0 ? (
              <Typography color="text.disabled" sx={{ py: 4, textAlign: 'center' }}>Aucun client payé</Typography>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width={50}>#</TableCell>
                      <TableCell>Client</TableCell>
                      <TableCell align="center">Nb Factures</TableCell>
                      <TableCell align="right">Total Encaissé</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topClients.map((c, i) => (
                      <TableRow key={c.id}>
                        <TableCell>{['🥇', '🥈', '🥉'][i] || (i + 1)}</TableCell>
                        <TableCell>{c.client}</TableCell>
                        <TableCell align="center">{c.count}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatAmount(c.total, devise)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
            <Box sx={{ mt: 2 }}>
              <Suspense fallback={<Skeleton variant="rounded" height={200} />}>
                <TopClientsChart data={topClients} currency={devise} height={200} />
              </Suspense>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Activité récente</Typography>
            {activity.length === 0 ? (
              <Typography color="text.disabled" sx={{ py: 4, textAlign: 'center' }}>Pas d'activité récente</Typography>
            ) : (
              <List dense sx={{ maxHeight: 320, overflow: 'auto', p: 0 }}>
                {activity.map((ev, idx) => {
                  const meta = ACTIVITY_LABEL[ev.type] || { text: ev.type, color: 'default' };
                  return (
                    <Box key={ev.id}>
                      {idx > 0 && <Divider component="li" />}
                      <ListItem
                        sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                        onClick={() => navigate(`/invoices/${ev.invoiceId}`)}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ width: 32, height: 32, fontSize: 12, bgcolor: 'primary.main' }}>
                            {initials(ev.userId)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="body2"><b>{ev.numero}</b></Typography>
                              <Chip size="small" label={meta.text} color={meta.color} />
                            </Stack>
                          }
                          secondary={fmtRel(ev.at)}
                        />
                      </ListItem>
                    </Box>
                  );
                })}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Row 5 — Pending invoices */}
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Factures en attente de validation ({pendingList.length})
          </Typography>
          {pendingList.length > 0 && (
            <Button size="small" onClick={() => navigate('/invoices')}>
              Voir toutes
            </Button>
          )}
        </Stack>
        {pendingList.length === 0 ? (
          <Typography color="text.disabled" sx={{ py: 4, textAlign: 'center' }}>
            Aucune facture en attente
          </Typography>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Numéro</TableCell>
                  <TableCell>Agent</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell align="right">Total TTC</TableCell>
                  <TableCell>Date soumission</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingList.map((inv) => {
                  const meta = STATUS_META[inv.statut];
                  return (
                    <TableRow key={inv.id} hover>
                      <TableCell>{inv.numero}</TableCell>
                      <TableCell>{initials(inv.userId)}</TableCell>
                      <TableCell>{inv.client_nom || '—'}</TableCell>
                      <TableCell align="right">{formatAmount(inv.total_ttc, inv.devise || devise)}</TableCell>
                      <TableCell>{fmtDate(inv.date_depot || inv.date_creation)}</TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => navigate(`/invoices/${inv.id}`)}>
                          Examiner
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
