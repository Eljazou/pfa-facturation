import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from 'recharts';
import { Box, Paper, Typography } from '@mui/material';
import { formatAmount, formatCompact } from '../../utils/format';
import EmptyChart from './EmptyChart';

const PALETTE = ['#1976d2', '#1E7145', '#C55A00', '#7B1FA2', '#00838F'];

function CustomTooltip({ active, payload, currency }) {
  if (!active || !payload || !payload.length) return null;
  const { client, total, count } = payload[0].payload;
  return (
    <Paper sx={{ p: 1.5, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="caption" fontWeight={600}>{client}</Typography>
      <Typography variant="body2">{formatAmount(total, currency)}</Typography>
      <Typography variant="caption" color="text.secondary">{count} facture{count !== 1 ? 's' : ''}</Typography>
    </Paper>
  );
}

const truncate = (s, n = 15) => (s && s.length > n ? `${s.slice(0, n)}…` : s);

export default function TopClientsChart({ data, currency = 'MAD', height = 280 }) {
  if (!data?.length) return <EmptyChart height={height} message="Aucun client payé" />;
  const decorated = data.map((d) => ({ ...d, clientShort: truncate(d.client) }));

  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={decorated} layout="vertical" margin={{ top: 8, right: 24, left: 24, bottom: 0 }}>
          <XAxis type="number" tickFormatter={(v) => formatCompact(v, '').trim()} tick={{ fontSize: 11 }} />
          <YAxis dataKey="clientShort" type="category" tick={{ fontSize: 12 }} width={100} />
          <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
          <Bar dataKey="total" radius={[0, 6, 6, 0]}>
            {decorated.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
