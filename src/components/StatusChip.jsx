import { Box, Typography } from '@mui/material';

const STYLES = {
  draft:     { bg: '#F1F5F9', fg: '#64748B', dot: '#94A3B8', label: 'Brouillon'  },
  pending:   { bg: '#FEF3C7', fg: '#92400E', dot: '#F59E0B', label: 'En attente', pulse: true },
  validated: { bg: '#D1FAE5', fg: '#065F46', dot: '#10B981', label: 'Validée'    },
  rejected:  { bg: '#FEE2E2', fg: '#991B1B', dot: '#EF4444', label: 'Rejetée'    },
  paid:      { bg: '#DBEAFE', fg: '#1E40AF', dot: '#3B82F6', label: 'Payée'      },
};

export default function StatusChip({ status, label, size = 'medium' }) {
  const meta = STYLES[status] || STYLES.draft;
  const small = size === 'small';
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        bgcolor: meta.bg,
        color: meta.fg,
        borderRadius: 999,
        px: small ? 1 : 1.25,
        py: small ? 0.25 : 0.5,
        fontSize: small ? 11 : 12,
        fontWeight: 500,
        lineHeight: 1.4,
      }}
    >
      <Box
        className={meta.pulse ? 'status-pulse' : undefined}
        sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: meta.dot }}
      />
      <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 'inherit', lineHeight: 'inherit' }}>
        {label || meta.label}
      </Typography>
    </Box>
  );
}
