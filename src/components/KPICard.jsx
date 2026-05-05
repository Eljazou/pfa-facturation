import { memo } from 'react';
import { Card, CardContent, Box, Typography, Skeleton, Chip } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

function KPICard({ title, value, subtitle, icon: Icon, color = '#1976d2', trend, loading }) {
  const trendNum = Number(trend);
  const hasTrend = trend !== undefined && trend !== null && !Number.isNaN(trendNum);
  const trendUp = trendNum >= 0;

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'box-shadow 0.2s, transform 0.2s',
        '&:hover': {
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          {Icon && (
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                bgcolor: `${color}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon sx={{ color }} />
            </Box>
          )}
          {hasTrend && (
            <Chip
              size="small"
              icon={trendUp ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />}
              label={`${trendUp ? '+' : ''}${trendNum.toFixed(0)}%`}
              sx={{
                bgcolor: trendUp ? 'success.50' : 'error.50',
                color:   trendUp ? 'success.dark' : 'error.dark',
                fontWeight: 600,
                '& .MuiChip-icon': { color: 'inherit' },
              }}
            />
          )}
        </Box>

        {loading ? (
          <Skeleton variant="text" width="70%" height={36} />
        ) : (
          <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1.2, mb: 0.5, wordBreak: 'break-word' }}>
            {value}
          </Typography>
        )}

        <Typography variant="body2" color="text.secondary">{title}</Typography>

        {subtitle && (
          <Typography
            variant="caption"
            display="block"
            color="text.secondary"
            sx={{ mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default memo(KPICard);
