import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, Typography, Stack, Skeleton, Button, MenuItem, TextField,
  Table, TableHead, TableBody, TableRow, TableCell, Chip, Avatar,
  CircularProgress, LinearProgress,
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PeopleIcon from '@mui/icons-material/People';
import BadgeIcon from '@mui/icons-material/Badge';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CancelIcon from '@mui/icons-material/Cancel';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { fetchAllInvoices } from '../invoices/invoicesSlice';
import {
  computeAdminKPIs, buildMonthlyRevenueData, buildStatusDistributionData,
  buildTopClientsData, buildRecentActivity, filterInvoices,
} from '../../services/dashboardService';
import { exportInvoicesToExcel, exportKPIsToExcel } from '../../services/exportService';
import { formatAmount } from '../../utils/format';
import { formatDistanceToNow } from '../../utils/timeFormat';
import { subscribeUsers } from '../../services/firebaseService';
import KPICard from '../../components/KPICard';
import StatusChip from '../../components/StatusChip';
import DashboardFilters from '../../components/DashboardFilters';
import ValidationActions from '../invoices/ValidationActions';

const StatusPieChart = lazy(() => import('../../components/charts/StatusPieChart'));

const STATUS_LABEL = {
  draft: 'Brouillon', pending: 'En attente', validated: 'Validée',
  rejected: 'Rejetée', paid: 'Payée',
};

const ACTIVITY_LABEL = {
  created:   { text: 'Créée',    color: '#94A3B8' },
  submitted: { text: 'Soumise',  color: '#F59E0B' },
  validated: { text: 'Validée',  color: '#10B981' },
  rejected:  { text: 'Rejetée',  color: '#EF4444' },
  paid:      { text: 'Payée',    color: '#3B82F6' },
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? String(iso) : d.toLocaleDateString('fr-FR');
};

// Custom bar tooltip
function CustomBarTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null;
  const { revenue, count } = payload[0].payload;
  return (
    <Box
      sx={{
        bgcolor: '#FFFFFF', border: '1px solid', borderColor: 'divider',
        borderRadius: 2.5, p: 1.5, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
    >
      <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 0.5 }}>{label}</Typography>
      <Typography sx={{ fontSize: 13, color: 'primary.main', fontWeight: 600 }}>
        {formatAmount(revenue, currency)}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {count} facture{count !== 1 ? 's' : ''}
      </Typography>
    </Box>
  );
}

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { invoices, loading } = useSelector((s) => s.invoices);
  const [filters, setFilters] = useState({});
  const [year, setYear]       = useState(new Date().getFullYear());
  const [usersById, setUsersById] = useState({});

  useEffect(() => { dispatch(fetchAllInvoices()); }, [dispatch]);

  // Real-time users map (id → user)
  useEffect(() => {
    const unsub = subscribeUsers((list) => {
      const map = {};
      list.forEach((u) => { map[u.id] = u; });
      setUsersById(map);
    });
    return unsub;
  }, []);

  const filtered = useMemo(() => filterInvoices(invoices, filters), [invoices, filters]);

  const kpis        = useMemo(() => computeAdminKPIs(filtered), [filtered]);
  const monthlyData = useMemo(() => buildMonthlyRevenueData(filtered, year), [filtered, year]);
  const statusData  = useMemo(() => buildStatusDistributionData(filtered), [filtered]);
  const topClients  = useMemo(() => buildTopClientsData(filtered, [], 3), [filtered]);
  const activity    = useMemo(() => buildRecentActivity(filtered, 8), [filtered]);

  // Per-agent stats
  const agentStats = useMemo(() => {
    const map = {};
    filtered.forEach((i) => {
      const key = i.userId || 'unknown';
      if (!map[key]) {
        map[key] = {
          id: key,
          name: usersById[key]?.displayName || `Agent ${String(key).slice(0, 6)}`,
          email: usersById[key]?.email || '',
          total: 0, validated: 0, rejected: 0, totalCA: 0,
        };
      }
      map[key].total += 1;
      if (i.statut === 'validated' || i.statut === 'paid') {
        map[key].validated += 1;
        map[key].totalCA += Number(i.total_ttc) || 0;
      }
      if (i.statut === 'rejected') map[key].rejected += 1;
    });
    return Object.values(map)
      .map((a) => ({ ...a, taux: a.total ? Math.round((a.validated / a.total) * 100) : 0 }))
      .sort((a, b) => b.totalCA - a.totalCA);
  }, [filtered, usersById]);

  // Pending invoices (newest first)
  const pendingInvoices = useMemo(
    () => filtered
      .filter((i) => i.statut === 'pending')
      .sort((a, b) => (b.date_depot || b.date_creation || '').localeCompare(a.date_depot || a.date_creation || '')),
    [filtered]
  );

  // Bar chart summary
  const barSummary = useMemo(() => {
    const yearTotal = monthlyData.reduce((s, m) => s + m.revenue, 0);
    const best = monthlyData.reduce((acc, m) => (m.revenue > acc.revenue ? m : acc), { month: '—', revenue: 0 });
    const monthsWithData = monthlyData.filter((m) => m.revenue > 0).length || 1;
    return { yearTotal, best, avg: yearTotal / 12, avgActive: yearTotal / monthsWithData };
  }, [monthlyData]);

  const yearOptions = useMemo(() => {
    const ys = new Set([year, new Date().getFullYear()]);
    invoices.forEach((i) => {
      const d = i.date_creation ? new Date(i.date_creation) : null;
      if (d && !isNaN(d.getTime())) ys.add(d.getFullYear());
    });
    return Array.from(ys).sort((a, b) => b - a);
  }, [invoices, year]);

  const devise   = filters.devise || 'MAD';
  const handleExport     = () => exportInvoicesToExcel(filtered, [], `factures_${new Date().toISOString().slice(0, 10)}.xlsx`);
  const handleExportKPIs = () => exportKPIsToExcel(kpis, { year }, `rapport_${year}.xlsx`);

  return (
    <Box sx={{ width: '100%' }}>
      {/* ROW 1 — Header + filters */}
      <Card sx={{ p: { xs: 2.5, md: 3 }, mb: 3 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          gap={2}
        >
          <Box>
            <Typography sx={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>
              Tableau de bord Admin
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Vue globale de toutes les activités
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }} sx={{ width: { xs: '100%', md: 'auto' } }}>
            <Box sx={{ '& > *': { mb: '0 !important' } }}>
              <DashboardFilters onChange={setFilters} onExport={handleExport} />
            </Box>
            <Button
              variant="outlined" size="small"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportKPIs}
            >
              Rapport
            </Button>
          </Stack>
        </Stack>
      </Card>

      {/* ROW 2 — KPI cards 1 */}
      <Grid container spacing={3} alignItems="stretch" sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
          <KPICard
            title="Total Factures"
            value={kpis.total_factures}
            subtitle="Tous agents confondus"
            icon={ReceiptLongIcon}
            color="#2563EB"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
          <KPICard
            title="Montant Total Encaissé"
            value={formatAmount(kpis.montant_encaisse, devise)}
            subtitle="Factures payées"
            icon={AccountBalanceIcon}
            color="#059669"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex', position: 'relative' }}>
          <Box
            onClick={() => {
              const el = document.getElementById('pending-table');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            sx={{ width: '100%', cursor: pendingInvoices.length > 0 ? 'pointer' : 'default', position: 'relative' }}
          >
            <KPICard
              title="En Attente de Validation"
              value={kpis.total_en_attente}
              subtitle="Nécessitent une action"
              icon={HourglassEmptyIcon}
              color="#D97706"
              loading={loading}
            />
            {kpis.total_en_attente > 0 && (
              <Box
                sx={{
                  position: 'absolute', top: 12, right: 12, width: 10, height: 10,
                  borderRadius: '50%', bgcolor: '#EF4444',
                  animation: 'adminPulse 2s infinite',
                  '@keyframes adminPulse': {
                    '0%':   { opacity: 1, transform: 'scale(1)' },
                    '50%':  { opacity: 0.5, transform: 'scale(1.3)' },
                    '100%': { opacity: 1, transform: 'scale(1)' },
                  },
                }}
              />
            )}
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
          <Card sx={{ p: 3, width: '100%', display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: '#7C3AED26', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircleIcon sx={{ color: '#7C3AED', fontSize: 24 }} />
              </Box>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                  variant="determinate"
                  value={Math.round(kpis.taux_validation)}
                  size={48}
                  thickness={4}
                  sx={{ color: '#7C3AED' }}
                />
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700 }}>
                    {Math.round(kpis.taux_validation)}%
                  </Typography>
                </Box>
              </Box>
            </Stack>
            <Box sx={{ mt: 2 }}>
              <Typography sx={{ fontSize: 26, fontWeight: 700, lineHeight: 1.15, mb: 0.5 }}>
                {Math.round(kpis.taux_validation)}%
              </Typography>
              <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>
                Taux de Validation
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, pt: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'block' }}>
                Factures approuvées
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* ROW 3 — KPI cards 2 */}
      <Grid container spacing={3} alignItems="stretch" sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
          <KPICard
            title="Clients Actifs" value={kpis.total_clients_actifs}
            subtitle="Clients avec factures"
            icon={PeopleIcon} color="#0891B2" loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
          <KPICard
            title="Agents Actifs" value={kpis.total_agents}
            subtitle="Comptables actifs"
            icon={BadgeIcon} color="#059669" loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
          <KPICard
            title="Montant Moyen / Facture"
            value={formatAmount(kpis.moyenne_facture, devise)}
            subtitle="Par facture en moyenne"
            icon={TrendingUpIcon} color="#D97706" loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
          <KPICard
            title="Factures Rejetées" value={kpis.total_rejetees}
            subtitle={`Taux: ${kpis.taux_rejet.toFixed(1)}%`}
            icon={CancelIcon} color="#DC2626" loading={loading}
          />
        </Grid>
      </Grid>

      {/* ROW 4 — Bar chart (8) | pie + top clients stacked (4) */}
      <Grid container spacing={3} alignItems="stretch" sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 8 }} sx={{ display: 'flex' }}>
          <Card sx={{ p: { xs: 2, md: 3 }, width: '100%', display: 'flex', flexDirection: 'column' }}>
            <Stack
              direction="row" justifyContent="space-between" alignItems="center"
              sx={{ mb: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}
            >
              <Box>
                <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Chiffre d'affaires mensuel</Typography>
                <Typography variant="caption" color="text.secondary">Montant encaissé par mois</Typography>
              </Box>
              <TextField
                select size="small"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                sx={{ width: 110 }}
              >
                {yearOptions.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </TextField>
            </Stack>

            <Box sx={{ flex: 1, minHeight: 280 }}>
              <ResponsiveContainer width="100%" height="100%" minHeight={280}>
                <BarChart data={monthlyData} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: '#64748B' }}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                  />
                  <Tooltip content={<CustomBarTooltip currency={devise} />} cursor={{ fill: 'rgba(37,99,235,0.06)' }} />
                  <Bar dataKey="revenue" fill="#2563EB" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </Box>

            <Stack direction="row" gap={3} sx={{ mt: 'auto', pt: 2, borderTop: '1px solid', borderColor: 'divider', flexWrap: 'wrap' }}>
              <Box>
                <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Meilleur mois</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {barSummary.best.month}: {formatAmount(barSummary.best.revenue, devise)}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Total année</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {formatAmount(barSummary.yearTotal, devise)}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Moyenne mensuelle</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {formatAmount(barSummary.avg, devise)}
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex' }}>
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Pie chart */}
            <Card sx={{ p: { xs: 2, md: 3 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                Répartition par statut
              </Typography>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>}>
                  <StatusPieChart data={statusData} size={220} showLegend={false} showLabels={false} />
                </Suspense>
                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1, justifyContent: 'center' }}>
                  {statusData.map((s) => (
                    <Box key={s.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mr: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color }} />
                      <Typography variant="caption" color="text.secondary">
                        {s.name} <b style={{ color: '#0F172A' }}>{s.value}</b>
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Card>

            {/* Top 3 Clients */}
            <Card sx={{ p: { xs: 2, md: 3 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                Top Clients
              </Typography>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.25, justifyContent: 'space-around' }}>
                {topClients.length === 0 ? (
                  <Typography variant="body2" color="text.disabled" align="center" sx={{ py: 2 }}>
                    Aucune donnée
                  </Typography>
                ) : (
                  topClients.map((client, index) => (
                    <Box
                      key={client.id}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        p: 1.5, borderRadius: 2,
                        bgcolor: index === 0 ? '#FEF9C3' : index === 1 ? '#F1F5F9' : '#FFF7ED',
                      }}
                    >
                      <Typography sx={{ fontSize: 18 }}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </Typography>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }} noWrap>
                          {client.client}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {client.count} facture{client.count > 1 ? 's' : ''}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'primary.main', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                        {formatAmount(client.total, devise)}
                      </Typography>
                    </Box>
                  ))
                )}
              </Box>
            </Card>
          </Box>
        </Grid>
      </Grid>

      {/* ROW 5 — Agent perf (7) + Activity feed (5) */}
      <Grid container spacing={3} alignItems="stretch" sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 7 }} sx={{ display: 'flex' }}>
          <Card sx={{ p: { xs: 2, md: 3 }, width: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography sx={{ fontSize: 15, fontWeight: 600, mb: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              Performance des agents
            </Typography>
            {agentStats.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center', color: 'text.disabled', flex: 1 }}>Aucun agent actif</Box>
            ) : (
              <Box sx={{ flex: 1, overflowX: 'auto', mx: { xs: -2, md: -3 } }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ pl: { xs: 2, md: 3 } }}>Agent</TableCell>
                      <TableCell align="right">Factures</TableCell>
                      <TableCell align="right">Validées</TableCell>
                      <TableCell align="right">Rejetées</TableCell>
                      <TableCell align="right">CA Total</TableCell>
                      <TableCell sx={{ pr: { xs: 2, md: 3 }, minWidth: 140 }}>Taux</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {agentStats.map((agent) => (
                      <TableRow key={agent.id} hover>
                        <TableCell sx={{ pl: { xs: 2, md: 3 } }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ width: 32, height: 32, fontSize: 12, bgcolor: '#DBEAFE', color: 'primary.main' }}>
                              {agent.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontSize: 13, fontWeight: 500 }} noWrap>{agent.name}</Typography>
                              {agent.email && <Typography variant="caption" color="text.secondary" noWrap>{agent.email}</Typography>}
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell align="right">{agent.total}</TableCell>
                        <TableCell align="right" sx={{ color: 'success.main', fontWeight: 500 }}>{agent.validated}</TableCell>
                        <TableCell align="right" sx={{ color: 'error.main', fontWeight: 500 }}>{agent.rejected}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                          {formatAmount(agent.totalCA, devise)}
                        </TableCell>
                        <TableCell sx={{ pr: { xs: 2, md: 3 } }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <LinearProgress
                              variant="determinate"
                              value={agent.taux}
                              sx={{
                                flex: 1, height: 6, borderRadius: 3,
                                bgcolor: 'grey.100',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: agent.taux > 70 ? 'success.main' : agent.taux > 40 ? 'warning.main' : 'error.main',
                                },
                              }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 30, fontVariantNumeric: 'tabular-nums' }}>
                              {agent.taux}%
                            </Typography>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }} sx={{ display: 'flex' }}>
          <Card sx={{ p: { xs: 2, md: 3 }, width: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Activité récente</Typography>
              <Typography variant="caption" color="text.secondary">Toutes les mises à jour</Typography>
            </Box>
            {activity.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center', color: 'text.disabled', flex: 1 }}>Aucune activité</Box>
            ) : (
              <Box sx={{ flex: 1, overflowY: 'auto', maxHeight: 420 }}>
                <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
                  {activity.map((ev) => {
                    const meta = ACTIVITY_LABEL[ev.type] || ACTIVITY_LABEL.created;
                    const agent = usersById[ev.userId]?.displayName || `Agent ${String(ev.userId || '').slice(0, 6)}`;
                    return (
                      <Stack
                        key={ev.id}
                        direction="row" spacing={1.5} alignItems="center"
                        onClick={() => navigate(`/invoices/${ev.invoiceId}`)}
                        sx={{ cursor: 'pointer', py: 1.25 }}
                      >
                        <Avatar sx={{ width: 34, height: 34, fontSize: 12, bgcolor: '#EFF6FF', color: 'primary.main', flexShrink: 0 }}>
                          {(agent || 'A').charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3 }} noWrap>
                            {agent}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>{ev.numero}</Box>
                            {' → '}
                            <Box component="span" sx={{ color: meta.color, fontWeight: 600 }}>{meta.text}</Box>
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0 }}>
                          {formatDistanceToNow(ev.at)}
                        </Typography>
                      </Stack>
                    );
                  })}
                </Stack>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* ROW 6 — Pending invoices table (admin action) */}
      <Card id="pending-table" sx={{ p: { xs: 2, md: 3 }, width: '100%' }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ sm: 'center' }}
          gap={1}
          sx={{ mb: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Factures en attente</Typography>
            {pendingInvoices.length > 0 && (
              <Chip
                size="small"
                label={pendingInvoices.length}
                sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 600 }}
              />
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {pendingInvoices.length > 0 ? 'Nécessitent votre validation' : 'Tout est à jour'}
          </Typography>
        </Stack>

        {pendingInvoices.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 44, color: 'success.light', mb: 1 }} />
            <Typography color="text.secondary" sx={{ fontSize: 14 }}>
              Aucune facture en attente
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto', mx: { xs: -2, md: -3 } }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: { xs: 2, md: 3 } }}>Numéro</TableCell>
                  <TableCell>Agent</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell align="right">Total TTC</TableCell>
                  <TableCell>Date soumission</TableCell>
                  <TableCell sx={{ pr: { xs: 2, md: 3 } }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingInvoices.map((inv) => (
                  <TableRow key={inv.id} hover>
                    <TableCell sx={{ pl: { xs: 2, md: 3 } }}>
                      <Box
                        component="span"
                        onClick={() => navigate(`/invoices/${inv.id}`)}
                        sx={{ color: 'primary.main', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                      >
                        {inv.numero}
                      </Box>
                    </TableCell>
                    <TableCell>{usersById[inv.userId]?.displayName || `Agent ${String(inv.userId || '').slice(0, 6)}`}</TableCell>
                    <TableCell>{inv.client_nom || '—'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      {formatAmount(inv.total_ttc, inv.devise || devise)}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {fmtDate(inv.date_depot || inv.date_creation)}
                    </TableCell>
                    <TableCell sx={{ pr: { xs: 2, md: 3 } }} align="right">
                      <Box sx={{ display: 'inline-flex' }}>
                        <ValidationActions invoice={inv} />
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>
    </Box>
  );
}
