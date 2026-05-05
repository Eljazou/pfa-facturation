import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
} from 'recharts';
import { Box, Paper, Typography } from '@mui/material';
import EmptyChart from './EmptyChart';

function CustomTooltip({ active, payload, total }) {
  if (!active || !payload || !payload.length) return null;
  const { name, value, color } = payload[0].payload;
  const pct = total ? ((value / total) * 100).toFixed(1) : 0;
  return (
    <Paper sx={{ p: 1.5, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 10, height: 10, bgcolor: color, borderRadius: '50%' }} />
        <Typography variant="body2" fontWeight={600}>{name}</Typography>
      </Box>
      <Typography variant="caption" color="text.secondary">{value} ({pct}%)</Typography>
    </Paper>
  );
}

export default function StatusPieChart({ data, size = 280, showLegend = true, showLabels = true }) {
  if (!data?.length) return <EmptyChart height={size} message="Aucune facture" />;
  const total = data.reduce((s, x) => s + x.value, 0);

  return (
    <Box sx={{ width: '100%', height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
            label={showLabels ? (e) => `${((e.value / total) * 100).toFixed(0)}%` : false}
            labelLine={false}
          >
            {data.map((d) => <Cell key={d.key} fill={d.color} />)}
          </Pie>
          <Tooltip content={<CustomTooltip total={total} />} />
          {showLegend && <Legend verticalAlign="bottom" iconType="circle" iconSize={8} />}
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
}
