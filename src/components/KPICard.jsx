import { memo } from 'react';
import { Box, Card, Typography, Skeleton } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

function KPICard({ title, value, subtitle, icon: Icon, color = '#2563EB', trend, loading, progress }) {
  const trendNum = Number(trend);
  const hasTrend = trend !== undefined && trend !== null && !Number.isNaN(trendNum);
  const trendUp  = trendNum >= 0;

  return (
    <Card
      sx={{
        p: 3,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 16px rgba(15,23,42,0.08)',
          borderColor: 'rgba(37,99,235,0.25)',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {Icon && (
          <Box
            sx={{
              width: 48, height: 48, borderRadius: 2.5,
              bgcolor: `${color}26`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon sx={{ color, fontSize: 24 }} />
          </Box>
        )}
        {hasTrend && (
          <Box
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.25,
              bgcolor: trendUp ? '#D1FAE5' : '#FEE2E2',
              color:   trendUp ? '#065F46' : '#991B1B',
              borderRadius: 999, px: 1, py: 0.25,
              fontSize: 11, fontWeight: 600,
            }}
          >
            {trendUp ? <ArrowUpwardIcon sx={{ fontSize: 12 }} /> : <ArrowDownwardIcon sx={{ fontSize: 12 }} />}
            {trendUp ? '+' : ''}{trendNum.toFixed(0)}%
          </Box>
        )}
      </Box>

      <Box>
        {loading ? (
          <Skeleton variant="text" width="65%" height={36} sx={{ mb: 0.5 }} />
        ) : (
          <Typography sx={{ fontSize: 26, fontWeight: 700, lineHeight: 1.15, mb: 0.5, color: 'text.primary', wordBreak: 'break-word' }}>
            {value}
          </Typography>
        )}
        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>{title}</Typography>
      </Box>

      {progress !== undefined && progress !== null && (
        <Box sx={{ mt: 'auto' }}>
          <Box sx={{ width: '100%', height: 6, bgcolor: 'grey.100', borderRadius: 999, overflow: 'hidden' }}>
            <Box sx={{
              height: '100%', width: `${Math.max(0, Math.min(100, progress))}%`,
              bgcolor: color, transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            }} />
          </Box>
          <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: 'text.secondary' }}>
            {Math.round(progress)}%
          </Typography>
        </Box>
      )}

      {subtitle && progress === undefined && (
        <Typography
          variant="caption"
          sx={{ mt: 'auto', pt: 1.5, borderTop: '1px solid', borderColor: 'divider', color: 'text.secondary' }}
        >
          {subtitle}
        </Typography>
      )}
    </Card>
  );
}

export default memo(KPICard);
