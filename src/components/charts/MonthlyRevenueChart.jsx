import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { Box, Paper, Typography } from '@mui/material';
import { formatAmount, formatCompact } from '../../utils/format';
import EmptyChart from './EmptyChart';

function CustomTooltip({ active, payload, label, currency }) {
  if (!active || !payload || !payload.length) return null;
  const { revenue, count } = payload[0].payload;
  return (
    <Paper sx={{ p: 1.5, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="caption" fontWeight={600}>{label}</Typography>
      <Typography variant="body2">{formatAmount(revenue, currency)}</Typography>
      <Typography variant="caption" color="text.secondary">{count} facture{count !== 1 ? 's' : ''}</Typography>
    </Paper>
  );
}

export default function MonthlyRevenueChart({ data, currency = 'MAD', height = 320 }) {
  const hasData = data?.some((d) => d.revenue > 0);
  if (!hasData) return <EmptyChart height={height} />;

  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => formatCompact(v, '').trim()} tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
          <Bar dataKey="revenue" fill="#1976d2" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
