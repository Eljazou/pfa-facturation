import { Box, Typography } from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';

// Returns the public origin used in QR codes & emails.
// 1. Prefers VITE_PUBLIC_URL (set this to the LAN IP in dev, the deployed
//    domain in prod, e.g. http://192.168.1.5:5173 or https://factura.app).
// 2. Falls back to window.location.origin.
export function getPublicBaseUrl() {
  const env = import.meta.env.VITE_PUBLIC_URL;
  if (env) return String(env).replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location) return window.location.origin;
  return '';
}

export function buildInvoiceQRValue(invoice) {
  if (!invoice?.id) return '';
  const base = getPublicBaseUrl();
  return `${base}/invoices/${invoice.id}`;
}

export default function QRPreview({ invoice, size = 110 }) {
  if (!invoice?.id && !invoice?.numero) return null;
  const value = buildInvoiceQRValue(invoice);
  if (!value) return null;

  // Detect if the QR will be unreachable from outside the dev machine
  const isLocalhost =
    typeof window !== 'undefined' &&
    /^https?:\/\/(localhost|127\.0\.0\.1)/.test(value) &&
    !import.meta.env.VITE_PUBLIC_URL;

  return (
    <Box
      sx={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.75,
        p: 1.5,
        bgcolor: 'white',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        maxWidth: '100%',
      }}
    >
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        bgColor="#ffffff"
        fgColor="#000000"
        includeMargin={false}
      />
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontSize: 11, lineHeight: 1.2, textAlign: 'center' }}
      >
        Scanner pour vérifier
      </Typography>
      {isLocalhost && (
        <Typography
          variant="caption"
          sx={{ fontSize: 10, lineHeight: 1.2, textAlign: 'center', color: 'warning.dark', maxWidth: 180 }}
        >
          ⚠ Lien local — définissez <code style={{ fontFamily: 'monospace' }}>VITE_PUBLIC_URL</code> pour un scan mobile
        </Typography>
      )}
    </Box>
  );
}
