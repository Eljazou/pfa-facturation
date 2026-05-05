import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Button, TextField, InputAdornment, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, IconButton, Tooltip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Search, Edit, Delete } from '@mui/icons-material';
import { addClient, editClient, removeClient, setClients } from './clientsSlice';
import { subscribeClients } from '../../services/firebaseService';
import ClientForm from './ClientForm';

export default function ClientListPage() {
  const dispatch = useDispatch();
  const { clients } = useSelector((s) => s.clients);
  const user = useSelector((s) => s.auth.user);

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });

  const showToast = (msg, severity = 'success') =>
    setToast({ open: true, msg, severity });

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeClients(user.uid, (data) => dispatch(setClients(data)));
    return unsub;
  }, [user?.uid, dispatch]);

  const handleAdd = async (values) => {
    try {
      await dispatch(addClient({ data: values, userId: user.uid })).unwrap();
      setFormOpen(false);
      showToast('Client ajouté avec succès');
    } catch {
      showToast("Erreur lors de l'ajout", 'error');
    }
  };

  const handleEdit = async (values) => {
    try {
      await dispatch(editClient({ id: editing.id, data: values, userId: user.uid })).unwrap();
      setEditing(null);
      showToast('Client modifié');
    } catch {
      showToast('Erreur lors de la modification', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(removeClient({ id: deleteTarget.id, userId: user.uid })).unwrap();
      setDeleteTarget(null);
      showToast('Client supprimé');
    } catch {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const filtered = clients.filter(
    (c) =>
      c.nom?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { field: 'nom', headerName: 'Nom', flex: 1, minWidth: 140 },
    { field: 'email', headerName: 'Email', flex: 1.5, minWidth: 180 },
    { field: 'tel', headerName: 'Téléphone', flex: 1, minWidth: 130 },
    { field: 'adresse', headerName: 'Adresse', flex: 2, minWidth: 200 },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      width: 110,
      renderCell: ({ row }) => (
        <>
          <Tooltip title="Modifier">
            <IconButton size="small" onClick={() => setEditing(row)}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Supprimer">
            <IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}>
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>Clients</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setFormOpen(true)}>
          Nouveau client
        </Button>
      </Box>

      <TextField
        placeholder="Rechercher par nom ou email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="small"
        sx={{ mb: 2, width: 320 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      <DataGrid
        rows={filtered}
        columns={columns}
        autoHeight
        pageSizeOptions={[10, 25, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        disableRowSelectionOnClick
        sx={{ bgcolor: 'background.paper', borderRadius: 2 }}
      />

      <ClientForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleAdd}
      />
      <ClientForm
        open={!!editing}
        onClose={() => setEditing(null)}
        onSubmit={handleEdit}
        initial={editing}
      />

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          Supprimer le client <strong>{deleteTarget?.nom}</strong> ?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Annuler</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
