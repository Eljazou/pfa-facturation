import { Box, Typography } from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';

export default function EmptyChart({ message = 'Aucune donnée à afficher', height = 280 }) {
  return (
    <Box
      sx={{
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'text.disabled',
      }}
    >
      <BarChartIcon sx={{ fontSize: 48, mb: 1 }} />
      <Typography variant="body2">{message}</Typography>
    </Box>
  );
}
