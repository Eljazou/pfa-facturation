import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { getInvoice, getCompanySettingsFromFirebase } from '../../services/firebaseService';
import { generatePDF } from '../../utils/pdfGenerator';

export default function PublicInvoicePage() {
  const { id } = useParams();
  const [pdfUrl, setPdfUrl] = useState(null);
  const [fileName, setFileName] = useState('facture.pdf');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let objectUrl = null;

    async function load() {
      try {
        const invoice = await getInvoice(id);
        if (!invoice) { setError('Facture introuvable.'); setLoading(false); return; }

        const companyData = await getCompanySettingsFromFirebase().catch(() => ({}));

        const doc = await generatePDF(
          invoice,
          null,
          companyData,
          invoice.signature_base64 || null
        );
        const blob = doc.output('blob');
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
        setFileName(`${invoice.numero || 'facture'}.pdf`);
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement.');
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2 }}>
        <CircularProgress />
        <Typography color="text.secondary">Chargement de la facture…</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1, bgcolor: 'grey.100', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Button
          variant="contained"
          size="small"
          startIcon={<DownloadIcon />}
          component="a"
          href={pdfUrl}
          download={fileName}
        >
          Télécharger
        </Button>
      </Box>
      <Box sx={{ flex: 1 }}>
        <iframe
          src={pdfUrl}
          title="Facture"
          width="100%"
          height="100%"
          style={{ border: 'none' }}
        />
      </Box>
    </Box>
  );
}
