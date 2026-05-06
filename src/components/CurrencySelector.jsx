import { useSelector } from 'react-redux';
import { TextField, MenuItem, Box } from '@mui/material';
import { CURRENCY_FLAGS } from '../utils/currencyService';

export default function CurrencySelector({
  value, onChange, size = 'small', label = 'Devise', sx,
}) {
  const currencies = useSelector((s) => s.settings?.currencies || []);
  const list = currencies.length ? currencies : [{ id: 'mad', code: 'MAD', symbol: 'MAD' }];

  return (
    <TextField
      select
      size={size}
      label={label}
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
      sx={sx}
    >
      {list.map((c) => (
        <MenuItem key={c.id || c.code} value={c.code}>
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
            <span>{CURRENCY_FLAGS[c.code] || '💱'}</span>
            <span>{c.code}</span>
            {c.symbol && c.symbol !== c.code && <span style={{ opacity: 0.6 }}>({c.symbol})</span>}
          </Box>
        </MenuItem>
      ))}
    </TextField>
  );
}
