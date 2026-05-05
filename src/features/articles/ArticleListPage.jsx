import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Button, Typography, FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, IconButton, Tooltip, Tabs, Tab,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Delete } from '@mui/icons-material';
import {
  fetchArticles, addArticle, editArticle, removeArticle, fetchCategories,
} from './articlesSlice';
import ArticleForm from './ArticleForm';
import CategoryList from './CategoryList';

export default function ArticleListPage() {
  const dispatch = useDispatch();
  const { articles, categories, loading } = useSelector((s) => s.articles);

  const [tab, setTab] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });

  const showToast = (msg, severity = 'success') => setToast({ open: true, msg, severity });

  useEffect(() => {
    dispatch(fetchArticles());
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleAdd = async (values) => {
    try {
      await dispatch(addArticle(values)).unwrap();
      setFormOpen(false);
      showToast('Article ajouté');
    } catch {
      showToast("Erreur lors de l'ajout", 'error');
    }
  };

  const handleEdit = async (values) => {
    try {
      await dispatch(editArticle({ id: editing.id, data: values })).unwrap();
      setEditing(null);
      showToast('Article modifié');
    } catch {
      showToast('Erreur lors de la modification', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(removeArticle(deleteTarget.id)).unwrap();
      setDeleteTarget(null);
      showToast('Article supprimé');
    } catch {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const getCategoryName = (catId) =>
    categories.find((c) => c.id === catId || c.id === Number(catId))?.nom ?? '—';

  const filtered =
    categoryFilter === 'all'
      ? articles
      : articles.filter(
          (a) => a.categorie_id === categoryFilter || a.categorie_id === Number(categoryFilter)
        );

  const columns = [
    { field: 'designation', headerName: 'Désignation', flex: 2, minWidth: 160 },
    {
      field: 'prix_unitaire',
      headerName: 'Prix unitaire (MAD)',
      flex: 1,
      minWidth: 160,
      renderCell: ({ value }) => `${Number(value).toFixed(2)} MAD`,
    },
    {
      field: 'categorie_id',
      headerName: 'Catégorie',
      flex: 1,
      minWidth: 130,
      renderCell: ({ value }) => getCategoryName(value),
    },
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
      <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
        Catalogue
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Articles" />
        <Tab label="Catégories" />
      </Tabs>

      {tab === 0 ? (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>Filtrer par catégorie</InputLabel>
              <Select
                value={categoryFilter}
                label="Filtrer par catégorie"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="all">Toutes les catégories</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.nom}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" startIcon={<Add />} onClick={() => setFormOpen(true)}>
              Nouvel article
            </Button>
          </Box>

          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <DataGrid
              rows={filtered}
              columns={columns}
              loading={loading}
              autoHeight
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              disableRowSelectionOnClick
              sx={{ bgcolor: 'background.paper', borderRadius: 2, minWidth: 600 }}
            />
          </Box>

          <ArticleForm
            open={formOpen}
            onClose={() => setFormOpen(false)}
            onSubmit={handleAdd}
            categories={categories}
          />
          <ArticleForm
            open={!!editing}
            onClose={() => setEditing(null)}
            onSubmit={handleEdit}
            initial={editing}
            categories={categories}
          />

          <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogContent>
              Supprimer l'article <strong>{deleteTarget?.designation}</strong> ?
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteTarget(null)}>Annuler</Button>
              <Button color="error" variant="contained" onClick={handleDelete}>
                Supprimer
              </Button>
            </DialogActions>
          </Dialog>
        </>
      ) : (
        <CategoryList categories={categories} onToast={showToast} />
      )}

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
