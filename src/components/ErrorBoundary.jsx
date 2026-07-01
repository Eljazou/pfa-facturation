import React from 'react';
import { Box, Typography, Button } from '@mui/material';

export default class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error(error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 2,
          backgroundColor: '#F8FAFC',
          textAlign: 'center',
          px: 3,
        }}>
          <Typography variant="h4" color="#0F172A" fontWeight={700}>
            😕 Une erreur est survenue
          </Typography>
          <Typography color="#64748B">
            Veuillez rafraîchir la page ou réessayer plus tard.
          </Typography>
          <Button
            variant="contained"
            onClick={() => { window.location.href = '/'; }}
          >
            Retour à l'accueil
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
