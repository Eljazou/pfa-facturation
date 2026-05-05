import { Box, Typography, Button } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate } from 'react-router-dom';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
      <LockIcon sx={{ fontSize: 64, color: 'error.main' }} />
      <Typography variant="h5">Accès non autorisé</Typography>
      <Typography color="text.secondary">Vous n&apos;avez pas les droits pour accéder à cette page.</Typography>
      <Button variant="contained" onClick={() => navigate(-1)}>Retour</Button>
    </Box>
  );
}
