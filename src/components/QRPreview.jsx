import { Box, Typography } from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';

export function buildInvoiceQRValue(invoice) {
  if (!invoice?.id) return '';
  const origin =
    typeof window !== 'undefined' && window.location
      ? window.location.origin
      : '';
  return `${origin}/invoices/${invoice.id}`;
}

export default function QRPreview({ invoice, size = 110 }) {
  if (!invoice?.id && !invoice?.numero) return null;
  const value = buildInvoiceQRValue(invoice);
  if (!value) return null;

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
    </Box>
  );
}
