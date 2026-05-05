import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { Box, Paper, Typography } from '@mui/material';
import EmptyChart from './EmptyChart';

function CustomTooltip({ active, payload, label, lines }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <Paper sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', minWidth: 140 }}>
      <Typography variant="caption" fontWeight={600}>{label}</Typography>
      {payload.map((p) => {
        const meta = lines.find((l) => l.key === p.dataKey);
        return (
          <Box key={p.dataKey} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Box sx={{ width: 8, height: 8, bgcolor: meta?.color, borderRadius: '50%' }} />
            <Typography variant="caption">{meta?.label || p.dataKey}: <b>{p.value}</b></Typography>
          </Box>
        );
      })}
    </Paper>
  );
}

export default function TrendLineChart({ data, lines, height = 280 }) {
  const hasData = data?.some((d) => lines.some((l) => d[l.key] > 0));
  if (!hasData) return <EmptyChart height={height} />;

  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip lines={lines} />} />
          <Legend verticalAlign="top" iconType="circle" iconSize={8} height={28} />
          {lines.map((l) => (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              name={l.label}
              stroke={l.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
