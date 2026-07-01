import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, Typography, Skeleton, Button, Stack,
  Table, TableHead, TableBody, TableRow, TableCell, MenuItem, TextField,
  CircularProgress,
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { fetchInvoices } from '../invoices/invoicesSlice';
import {
  computeUserKPIs, buildStatusDistributionData, buildMonthlyTrendData,
  buildRecentActivity, filterInvoices, countOverdue,
} from '../../services/dashboardService';
import { exportInvoicesToExcel } from '../../services/exportService';
import { formatAmount } from '../../utils/format';
import { formatDistanceToNow } from '../../utils/timeFormat';
import KPICard from '../../components/KPICard';
import StatusChip from '../../components/StatusChip';
import EmptyState from '../../components/EmptyState';
import DashboardFilters from '../../components/DashboardFilters';

const StatusPieChart = lazy(() => import('../../components/charts/StatusPieChart'));
const TrendLineChart = lazy(() => import('../../components/charts/TrendLineChart'));

const TREND_LINES = [
  { key: 'created',   label: 'Créées',   color: '#2563EB' },
  { key: 'validated', label: 'Validées', color: '#059669' },
  { key: 'rejected',  label: 'Rejetées', color: '#DC2626' },
];

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

const safePct = (num, denom) => {
  if (!denom || denom <= 0) return 0;
  return Math.max(0, Math.min(100, (num / denom) * 100));
};

export default function UserDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const { invoices, loading } = useSelector((s) => s.invoices);
  const [filters, setFilters] = useState({});
  const [trendYear, setTrendYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (user?.uid) dispatch(fetchInvoices(user.uid));
  }, [dispatch, user?.uid]);

  const myInvoices = useMemo(
    () => invoices.filter((i) => i.userId === user?.uid),
    [invoices, user?.uid]
  );

  const filtered = useMemo(() => filterInvoices(myInvoices, filters), [myInvoices, filters]);

  const kpis       = useMemo(() => computeUserKPIs(filtered, user?.uid), [filtered, user?.uid]);
  const statusData = useMemo(() => buildStatusDistributionData(filtered), [filtered]);
  const overdue    = useMemo(() => countOverdue(filtered), [filtered]);
  const activity   = useMemo(() => buildRecentActivity(filtered, 5), [filtered]);

  const summary = useMemo(() => {
    const totalHT  = filtered.reduce((s, i) => s + (Number(i.total_ht) || 0), 0);
    const totalTVA = filtered.reduce((s, i) => s + (Number(i.tva_montant) || 0), 0);
    const totalTTC = filtered.reduce((s, i) => s + (Number(i.total_ttc) || 0), 0);
    const avg      = filtered.length ? totalTTC / filtered.length : 0;
    return { totalHT, totalTVA, avg };
  }, [filtered]);

  const trendInvoices = useMemo(
    () => filtered.filter((i) => {
      if (!i.date_creation) return false;
      const d = new Date(i.date_creation);
      return !isNaN(d.getTime()) && d.getFullYear() === trendYear;
    }),
    [filtered, trendYear]
  );
  const trendData = useMemo(() => buildMonthlyTrendData(trendInvoices, 6), [trendInvoices]);

  const yearOptions = useMemo(() => {
    const ys = new Set([trendYear, new Date().getFullYear()]);
    myInvoices.forEach((i) => {
      const d = i.date_creation ? new Date(i.date_creation) : null;
      if (d && !isNaN(d.getTime())) ys.add(d.getFullYear());
    });
    return Array.from(ys).sort((a, b) => b - a);
  }, [myInvoices, trendYear]);

  const recent = useMemo(
    () => [...filtered]
      .sort((a, b) => (b.date_creation || '').localeCompare(a.date_creation || ''))
      .slice(0, 5),
    [filtered]
  );

  const devise = filters.devise || 'MAD';
  const isEmpty = !loading && myInvoices.length === 0;

  const handleExport = () => {
    exportInvoicesToExcel(filtered, [], `mes_factures_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (isEmpty) {
    return (
      <EmptyState
        icon={ReceiptLongIcon}
        title="Aucune facture pour l'instant"
        description="Commencez par créer votre première facture."
        action="Créer votre première facture"
        onAction={() => navigate('/invoices/new')}
      />
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* ROW 1 — greeting + filters in one card */}
      <Card sx={{ p: { xs: 2.5, md: 3 }, mb: 3 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          gap={2}
        >
          <Box>
            <Typography sx={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>
              Bonjour, {user?.displayName || 'Comptable'} 👋
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Voici l'aperçu de votre activité.
            </Typography>
          </Box>
          <Box sx={{ flex: 1, width: '100%', '& > *': { mb: '0 !important' } }}>
            <DashboardFilters onChange={setFilters} onExport={handleExport} />
          </Box>
        </Stack>
      </Card>

      {/* ROW 2 — 4 KPI cards, full row width */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
          <KPICard
            title="Total Factures"
            value={kpis.total_factures}
            icon={ReceiptLongIcon}
            color="#2563EB"
            loading={loading}
            progress={safePct(kpis.total_validees + kpis.total_payees, kpis.total_factures)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
          <KPICard
            title="Montant Encaissé"
            value={formatAmount(kpis.montant_encaisse, devise)}
            icon={AccountBalanceIcon}
            color="#059669"
            loading={loading}
            progress={safePct(kpis.montant_encaisse, kpis.montant_total_ttc)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
          <KPICard
            title="En Attente"
            value={kpis.total_en_attente}
            icon={HourglassEmptyIcon}
            color="#D97706"
            loading={loading}
            progress={safePct(kpis.total_en_attente, kpis.total_factures)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
          <KPICard
            title="Rejetées"
            value={kpis.total_rejetees}
            icon={CancelIcon}
            color="#DC2626"
            loading={loading}
            progress={safePct(kpis.total_rejetees, kpis.total_factures)}
          />
        </Grid>
        {overdue > 0 && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
            <KPICard
              title="En retard (>30j)"
              value={overdue}
              icon={WarningAmberIcon}
              color="#DC2626"
              loading={loading}
            />
          </Grid>
        )}
      </Grid>

      {/* ROW 3 — recent invoices (8) | pie + summary + activity stacked (4) */}
      <Grid container spacing={3} alignItems="stretch" sx={{ mb: 3 }}>
        {/* Left — recent invoices table (full-height card with footer) */}
        <Grid size={{ xs: 12, md: 8 }} sx={{ display: 'flex' }}>
          <Card sx={{ p: { xs: 2, md: 3 }, width: '100%', display: 'flex', flexDirection: 'column' }}>
            <SectionHeader
              title="Factures récentes"
              actionLabel="Voir toutes"
              onAction={() => navigate('/invoices')}
            />
            {loading ? (
              <Skeleton variant="rounded" height={260} sx={{ flex: 1 }} />
            ) : recent.length === 0 ? (
              <Box sx={{ py: 5, textAlign: 'center', color: 'text.disabled', flex: 1 }}>Aucune facture</Box>
            ) : (
              <>
                <Box sx={{ overflowX: 'auto', mx: { xs: -2, md: -3 } }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ pl: { xs: 2, md: 3 } }}>Numéro</TableCell>
                        <TableCell>Client</TableCell>
                        <TableCell align="right">Total TTC</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell sx={{ pr: { xs: 2, md: 3 } }}>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recent.map((inv) => (
                        <TableRow
                          key={inv.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/invoices/${inv.id}`)}
                        >
                          <TableCell sx={{ pl: { xs: 2, md: 3 } }}>
                            <Box
                              component="span"
                              sx={{
                                color: 'primary.main',
                                fontWeight: 600,
                                '&:hover': { textDecoration: 'underline' },
                              }}
                            >
                              {inv.numero}
                            </Box>
                          </TableCell>
                          <TableCell>{inv.client_nom || '—'}</TableCell>
                          <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                            {formatAmount(inv.total_ttc, inv.devise || devise)}
                          </TableCell>
                          <TableCell>
                            <StatusChip status={inv.statut} size="small" />
                          </TableCell>
                          <TableCell sx={{ pr: { xs: 2, md: 3 }, color: 'text.secondary' }}>
                            {fmtDate(inv.date_creation)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>

                {/* Bottom stat bar — pushes to bottom */}
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  gap={1.5}
                  sx={{
                    mt: 'auto', pt: 2,
                    borderTop: '1px solid', borderColor: 'divider',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Affichage des {recent.length} dernières factures sur {filtered.length}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                    onClick={() => navigate('/invoices')}
                  >
                    Voir toutes les factures
                  </Button>
                </Stack>
              </>
            )}
          </Card>
        </Grid>

        {/* Right — stacked: pie + summary + activity, all stretch equally */}
        <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex' }}>
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Pie chart */}
            <Card sx={{ p: { xs: 2, md: 3 }, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'visible' }}>
              <SectionHeader title="Répartition par statut" />
              <Suspense
                fallback={
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress size={28} />
                  </Box>
                }
              >
                <StatusPieChart data={statusData} size={260} showLegend={false} showLabels={false} />
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
            </Card>

            {/* Résumé financier */}
            <Card sx={{ p: { xs: 2, md: 3 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1.5 }}>
                Résumé financier
              </Typography>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
              {[
                { label: 'Montant total HT',       value: summary.totalHT,  color: '#2563EB' },
                { label: 'Total TVA',              value: summary.totalTVA, color: '#7C3AED' },
                { label: 'Montant moyen / facture', value: summary.avg,      color: '#059669' },
              ].map((stat, i, arr) => (
                <Box
                  key={stat.label}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1.25,
                    borderBottom: i < arr.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: stat.color, flexShrink: 0 }} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {stat.label}
                    </Typography>
                  </Stack>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', flexShrink: 0, ml: 1 }}>
                    {formatAmount(stat.value, devise)}
                  </Typography>
                </Box>
              ))}
              </Box>
            </Card>

            {/* Activité récente */}
            <Card sx={{ p: { xs: 2, md: 3 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1.5 }}>
                Activité récente
              </Typography>
              {activity.length === 0 ? (
                <Box sx={{ py: 3, textAlign: 'center', color: 'text.disabled', fontSize: 13, flex: 1 }}>
                  Aucune activité récente
                </Box>
              ) : (
                <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
                  {activity.slice(0, 4).map((ev) => {
                    const meta = ACTIVITY_LABEL[ev.type] || ACTIVITY_LABEL.created;
                    return (
                      <Stack
                        key={ev.id}
                        direction="row"
                        alignItems="center"
                        spacing={1.25}
                        onClick={() => navigate(`/invoices/${ev.invoiceId}`)}
                        sx={{
                          cursor: 'pointer',
                          py: 1.1,
                          '&:hover .num': { textDecoration: 'underline' },
                        }}
                      >
                        <Box
                          sx={{
                            width: 8, height: 8, borderRadius: '50%',
                            bgcolor: meta.color, flexShrink: 0,
                          }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            className="num"
                            sx={{ color: 'primary.main', fontWeight: 600, lineHeight: 1.3 }}
                            noWrap
                          >
                            {ev.numero} <Box component="span" sx={{ color: 'text.primary', fontWeight: 500 }}>→ {meta.text}</Box>
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0 }}>
                          {formatDistanceToNow(ev.at)}
                        </Typography>
                      </Stack>
                    );
                  })}
                </Stack>
              )}
            </Card>
          </Box>
        </Grid>
      </Grid>

      {/* ROW 4 — full-width trend chart */}
      <Card sx={{ p: { xs: 2, md: 3 } }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Évolution mensuelle</Typography>
          <TextField
            select
            size="small"
            value={trendYear}
            onChange={(e) => setTrendYear(Number(e.target.value))}
            sx={{ width: 110 }}
          >
            {yearOptions.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </TextField>
        </Stack>
        <Suspense fallback={<Skeleton variant="rounded" height={260} />}>
          <TrendLineChart data={trendData} lines={TREND_LINES} height={260} />
        </Suspense>
      </Card>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{ mb: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}
    >
      <Typography sx={{ fontSize: 15, fontWeight: 600 }}>{title}</Typography>
      {actionLabel && onAction && (
        <Button
          variant="text"
          size="small"
          endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </Stack>
  );
}
