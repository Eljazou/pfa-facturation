import { useState, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box, TextField, InputAdornment, Paper, Typography, List,
  ListItemButton, ListItemText, Divider, Chip, ClickAwayListener,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PeopleIcon from '@mui/icons-material/People';
import { tokens } from '../theme';

const STATUS_LABEL = {
  draft: 'Brouillon', pending: 'En attente', validated: 'Validée',
  rejected: 'Rejetée', paid: 'Payée',
};
const STATUS_COLOR = {
  draft: 'default', pending: 'warning', validated: 'success',
  rejected: 'error', paid: 'info',
};

export default function GlobalSearch() {
  const navigate = useNavigate();
  const { invoices } = useSelector((s) => s.invoices);
  const { clients }  = useSelector((s) => s.clients);

  const [query, setQuery]   = useState('');
  const [open,  setOpen]    = useState(false);
  const inputRef = useRef(null);

  const q = query.trim().toLowerCase();

  const matchedInvoices = q.length >= 1
    ? invoices.filter((inv) =>
        inv.numero?.toLowerCase().includes(q) ||
        inv.client_nom?.toLowerCase().includes(q)
      ).slice(0, 5)
    : [];

  const matchedClients = q.length >= 1
    ? clients.filter((c) =>
        c.nom?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.ville?.toLowerCase().includes(q)
      ).slice(0, 4)
    : [];

  const hasResults = matchedInvoices.length > 0 || matchedClients.length > 0;

  const handleSelect = useCallback((path) => {
    setQuery('');
    setOpen(false);
    navigate(path);
  }, [navigate]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setQuery(''); setOpen(false); }
  };

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box sx={{ position: 'relative', width: 280 }}>
        <TextField
          inputRef={inputRef}
          placeholder="Rechercher…"
          size="small"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          sx={{
            width: '100%',
            '& .MuiOutlinedInput-root': { bgcolor: tokens.color.bgApp, height: 38 },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />

        {open && q.length >= 1 && (
          <Paper
            elevation={8}
            sx={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              zIndex: 9999,
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              maxHeight: 380,
              overflowY: 'auto',
            }}
          >
            {!hasResults && (
              <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Aucun résultat pour « {query} »
                </Typography>
              </Box>
            )}

            {matchedInvoices.length > 0 && (
              <>
                <Box sx={{ px: 2, pt: 1.5, pb: 0.5, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <ReceiptLongIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Factures
                  </Typography>
                </Box>
                <List dense disablePadding>
                  {matchedInvoices.map((inv) => (
                    <ListItemButton
                      key={inv.id}
                      onClick={() => handleSelect(`/invoices/${inv.id}`)}
                      sx={{ px: 2, py: 0.75 }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight={600}>{inv.numero}</Typography>
                            <Chip
                              label={STATUS_LABEL[inv.statut] || inv.statut}
                              color={STATUS_COLOR[inv.statut] || 'default'}
                              size="small"
                              sx={{ height: 18, fontSize: 11 }}
                            />
                          </Box>
                        }
                        secondary={inv.client_nom}
                        secondaryTypographyProps={{ variant: 'caption', noWrap: true }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, ml: 1 }}>
                        {Number(inv.total_ttc || 0).toFixed(0)} {inv.devise || 'MAD'}
                      </Typography>
                    </ListItemButton>
                  ))}
                </List>
              </>
            )}

            {matchedInvoices.length > 0 && matchedClients.length > 0 && <Divider />}

            {matchedClients.length > 0 && (
              <>
                <Box sx={{ px: 2, pt: 1.5, pb: 0.5, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <PeopleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Clients
                  </Typography>
                </Box>
                <List dense disablePadding>
                  {matchedClients.map((c) => (
                    <ListItemButton
                      key={c.id}
                      onClick={() => handleSelect('/clients')}
                      sx={{ px: 2, py: 0.75 }}
                    >
                      <ListItemText
                        primary={c.nom}
                        secondary={c.email || c.ville || ''}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                        secondaryTypographyProps={{ variant: 'caption', noWrap: true }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </>
            )}

            {hasResults && (
              <Box sx={{ px: 2, py: 1, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
                <Typography variant="caption" color="text.secondary">
                  Appuyez sur Entrée ou cliquez un résultat
                </Typography>
              </Box>
            )}
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  );
}
