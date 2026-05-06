import { Box, Typography, Stack } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

const FEATURES = [
  'Génération PDF instantanée',
  'Suivi des paiements en temps réel',
  'Tableau de bord analytique',
  'Multi-devises et multi-entreprises',
];

export default function AuthSplitLayout({ children }) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Left panel — desktop only */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          width: '40%',
          maxWidth: 560,
          color: '#FFFFFF',
          p: 6,
          background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative blobs */}
        <Box sx={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.05)', top: -120, right: -120,
        }} />
        <Box sx={{
          position: 'absolute', width: 280, height: 280, borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.05)', bottom: -80, left: -80,
        }} />

        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(10px)',
          }}>
            <ReceiptLongIcon sx={{ fontSize: 22 }} />
          </Box>
          <Typography sx={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>
            FacturaPro
          </Typography>
        </Stack>

        <Box sx={{ mt: 'auto', position: 'relative', zIndex: 1 }}>
          <Typography sx={{ fontSize: 32, fontWeight: 700, lineHeight: 1.2, mb: 2, letterSpacing: '-0.02em' }}>
            Gérez vos factures<br />en toute simplicité
          </Typography>
          <Typography sx={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', mb: 4 }}>
            La plateforme de facturation moderne pour les entreprises marocaines.
          </Typography>

          <Stack spacing={1.5}>
            {FEATURES.map((f) => (
              <Stack key={f} direction="row" spacing={1.25} alignItems="center">
                <CheckCircleIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.9)' }} />
                <Typography sx={{ fontSize: 14, color: 'rgba(255,255,255,0.92)' }}>{f}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        <Typography variant="caption" sx={{ position: 'relative', zIndex: 1, mt: 4, opacity: 0.6 }}>
          © FacturaPro 2026
        </Typography>
      </Box>

      {/* Right panel — form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, md: 6 },
          minWidth: 0,
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 420 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
