import { useEffect, useState } from 'react';
import {
  Box, TextField, MenuItem, Button, Stack,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

const DEVISES = ['', 'MAD', 'EUR', 'USD'];

const yearStart = () => `${new Date().getFullYear()}-01-01`;
const todayISO  = () => new Date().toISOString().slice(0, 10);

export default function DashboardFilters({
  onChange,
  onExport,
  agents = [],          // [{ id, label }] — admin only
  showAgentFilter = false,
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

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap alignItems="center">
        <TextField
          label="Du"
          type="date"
          size="small"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ width: 150 }}
        />
        <TextField
          label="Au"
          type="date"
          size="small"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ width: 150 }}
        />
        <TextField
          select
          label="Devise"
          size="small"
          value={devise}
          onChange={(e) => setDevise(e.target.value)}
          sx={{ width: 120 }}
        >
          {DEVISES.map((d) => (
            <MenuItem key={d || 'all'} value={d}>{d || 'Toutes'}</MenuItem>
          ))}
        </TextField>
        {showAgentFilter && (
          <TextField
            select
            label="Agent"
            size="small"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            sx={{ width: 200 }}
          >
            <MenuItem value="">Tous</MenuItem>
            {agents.map((a) => (
              <MenuItem key={a.id} value={a.id}>{a.label}</MenuItem>
            ))}
          </TextField>
        )}
        <Box sx={{ flex: 1 }} />
        <Button startIcon={<RefreshIcon />} onClick={reset} size="small">
          Réinitialiser
        </Button>
        {onExport && (
          <Button
            startIcon={<FileDownloadIcon />}
            onClick={onExport}
            variant="outlined"
            size="small"
          >
            Exporter
          </Button>
        )}
      </Stack>
    </Box>
  );
}
