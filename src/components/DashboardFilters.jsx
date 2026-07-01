import { useEffect, useState } from 'react';
import {
  Box, TextField, MenuItem, Button, IconButton, Tooltip, Stack,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

const DEVISES = ['', 'MAD', 'EUR', 'USD'];
const yearStart = () => `${new Date().getFullYear()}-01-01`;
const todayISO  = () => new Date().toISOString().slice(0, 10);

export default function DashboardFilters({
  onChange, onExport, agents = [], showAgentFilter = false,
}) {
  const [dateFrom, setDateFrom] = useState(yearStart());
  const [dateTo,   setDateTo]   = useState(todayISO());
  const [devise,   setDevise]   = useState('');
  const [agentId,  setAgentId]  = useState('');

  useEffect(() => {
    onChange?.({
      dateFrom: dateFrom || undefined,
      dateTo:   dateTo   || undefined,
      devise:   devise   || undefined,
      agentId:  agentId  || undefined,
    });
  }, [dateFrom, dateTo, devise, agentId, onChange]);

  const reset = () => {
    setDateFrom(yearStart());
    setDateTo(todayISO());
    setDevise('');
    setAgentId('');
  };

  const duField = (sx = {}) => (
    <TextField
      label="Du" type="date" size="small"
      value={dateFrom}
      onChange={(e) => setDateFrom(e.target.value)}
      slotProps={{ inputLabel: { shrink: true } }}
      sx={sx}
    />
  );
  const auField = (sx = {}) => (
    <TextField
      label="Au" type="date" size="small"
      value={dateTo}
      onChange={(e) => setDateTo(e.target.value)}
      slotProps={{ inputLabel: { shrink: true } }}
      sx={sx}
    />
  );
  const deviseField = (sx = {}) => (
    <TextField
      select label="Devise" size="small"
      value={devise}
      onChange={(e) => setDevise(e.target.value)}
      sx={sx}
    >
      {DEVISES.map((d) => (
        <MenuItem key={d || 'all'} value={d}>{d || 'Toutes'}</MenuItem>
      ))}
    </TextField>
  );
  const resetBtn = (sx = {}) => (
    <Tooltip title="Réinitialiser">
      <IconButton onClick={reset} size="small"
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: '7px', ...sx }}
      >
        <RefreshIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
  const exportBtn = onExport ? (
    <Button startIcon={<FileDownloadIcon />} onClick={onExport} variant="outlined" size="small"
      sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
    >
      Exporter
    </Button>
  ) : null;

  return (
    <Box>
      {/* ── MOBILE layout: 2 rows ── */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mt: 1.5 }}>
        <Stack direction="row" spacing={1}>
          {duField({ flex: 1 })}
          {auField({ flex: 1 })}
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          {deviseField({ flex: 1 })}
          {resetBtn()}
          {exportBtn}
        </Stack>
      </Box>

      {/* ── DESKTOP layout: single row ── */}
      <Stack
        direction="row" spacing={1} alignItems="center"
        sx={{ display: { xs: 'none', md: 'flex' } }}
      >
        {duField({ flex: 1 })}
        {auField({ flex: 1 })}
        {deviseField({ flex: 1, maxWidth: 160 })}
        {showAgentFilter && (
          <TextField
            select label="Agent" size="small"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            sx={{ flex: 1, maxWidth: 200 }}
          >
            <MenuItem value="">Tous</MenuItem>
            {agents.map((a) => (
              <MenuItem key={a.id} value={a.id}>{a.label}</MenuItem>
            ))}
          </TextField>
        )}
        {resetBtn()}
        {exportBtn}
      </Stack>
    </Box>
  );
}
