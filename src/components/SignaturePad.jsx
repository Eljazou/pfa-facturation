import { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Alert, Typography,
} from '@mui/material';

export default function SignaturePad({ open, onClose, onSave }) {
  const canvasRef = useRef(null);
  const [error, setError] = useState('');

  // Clear canvas every time the dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => canvasRef.current?.clear(), 50);
      setError('');
    }
  }, [open]);

  const handleClear = () => {
    canvasRef.current?.clear();
    setError('');
  };

  const handleSave = () => {
    if (!canvasRef.current || canvasRef.current.isEmpty()) {
      setError('Veuillez signer avant de confirmer');
      return;
    }
    const dataURL = canvasRef.current.toDataURL('image/png');
    onSave(dataURL);
    onClose();
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Signature électronique</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {error}
          </Alert>
        )}
        <Box
          sx={{
            border: '2px dashed #ccc',
            borderRadius: 1,
            bgcolor: '#f9fafb',
            position: 'relative',
            height: 300,
            overflow: 'hidden',
          }}
        >
          {/* Watermark */}
          <Typography
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#e8e8e8',
              fontSize: 24,
              fontWeight: 700,
              pointerEvents: 'none',
              userSelect: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Signez ici
          </Typography>

          <SignatureCanvas
            ref={canvasRef}
            canvasProps={{
              style: {
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 1,
              },
            }}
            backgroundColor="transparent"
            penColor="#1a1a2e"
            onBegin={() => setError('')}
          />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          Dessinez votre signature dans la zone ci-dessus.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClear} color="inherit">
          Effacer
        </Button>
        <Button onClick={handleClose}>Annuler</Button>
        <Button onClick={handleSave} variant="contained">
          Confirmer
        </Button>
      </DialogActions>
    </Dialog>
  );
}
