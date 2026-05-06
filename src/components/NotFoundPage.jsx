import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Box sx={{ textAlign: 'center', py: 10, px: 3 }}>
      <SentimentDissatisfiedIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h3" fontWeight={700} sx={{ mb: 1 }}>404</Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
        Page introuvable
      </Typography>
      <Button variant="contained" onClick={() => navigate('/')}>
        Retour à l'accueil
      </Button>
    </Box>
  );
}
