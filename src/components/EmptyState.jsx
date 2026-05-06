import { Box, Typography, Button } from '@mui/material';

export default function EmptyState({ icon: Icon, title, description, action, onAction, sx }) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: { xs: 6, md: 8 },
        px: 3,
        ...sx,
      }}
    >
      {Icon && (
        <Box
          sx={{
            width: 64, height: 64, borderRadius: 2,
            bgcolor: 'primary.light',
            color: 'primary.main',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            mb: 2,
          }}
        >
          <Icon sx={{ fontSize: 32 }} />
        </Box>
      )}
      {title && (
        <Typography variant="h4" sx={{ mb: 1 }}>{title}</Typography>
      )}
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, mx: 'auto', mb: action ? 3 : 0 }}>
          {description}
        </Typography>
      )}
      {action && (
        <Button variant="contained" onClick={onAction}>
          {action}
        </Button>
      )}
    </Box>
  );
}
