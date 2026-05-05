import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box, Button, List, ListItem, ListItemText, ListItemSecondaryAction,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Stack, Typography, Tooltip, Chip,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { addCategory, editCategory, removeCategory } from './articlesSlice';

const schema = Yup.object({
  nom: Yup.string().required('Nom requis'),
  tva_rate: Yup.number()
    .typeError('Doit être un nombre')
    .min(0, 'Min 0')
    .max(100, 'Max 100')
    .required('TVA requise'),
});

function CategoryForm({ open, onClose, onSubmit, initial }) {
  const formik = useFormik({
    initialValues: initial ? { nom: initial.nom, tva_rate: initial.tva_rate } : { nom: '', tva_rate: '' },
    validationSchema: schema,
    enableReinitialize: true,
    onSubmit: (values, { resetForm }) => {
      onSubmit({ ...values, tva_rate: Number(values.tva_rate) });
      resetForm();
    },
  });

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>{initial ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Nom"
              name="nom"
              value={formik.values.nom}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.nom && !!formik.errors.nom}
              helperText={formik.touched.nom && formik.errors.nom}
              fullWidth
            />
            <TextField
              label="Taux TVA (%)"
              name="tva_rate"
              type="number"
              value={formik.values.tva_rate}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.tva_rate && !!formik.errors.tva_rate}
              helperText={formik.touched.tva_rate && formik.errors.tva_rate}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Annuler</Button>
          <Button type="submit" variant="contained" disabled={formik.isSubmitting}>
            {initial ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default function CategoryList({ categories, onToast }) {
  const dispatch = useDispatch();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleAdd = async (values) => {
    try {
      await dispatch(addCategory(values)).unwrap();
      setFormOpen(false);
      onToast('Catégorie ajoutée');
    } catch {
      onToast("Erreur lors de l'ajout", 'error');
    }
  };

  const handleEdit = async (values) => {
    try {
      await dispatch(editCategory({ id: editing.id, data: values })).unwrap();
      setEditing(null);
      onToast('Catégorie modifiée');
    } catch {
      onToast('Erreur lors de la modification', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(removeCategory(deleteTarget.id)).unwrap();
      setDeleteTarget(null);
      onToast('Catégorie supprimée');
    } catch {
      onToast('Erreur lors de la suppression', 'error');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Catégories</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setFormOpen(true)}>
          Nouvelle catégorie
        </Button>
      </Box>

      <List sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
        {categories.length === 0 && (
          <ListItem>
            <ListItemText secondary="Aucune catégorie" />
          </ListItem>
        )}
        {categories.map((cat) => (
          <ListItem key={cat.id} divider>
            <ListItemText
              primary={cat.nom}
              secondary={<Chip label={`TVA : ${cat.tva_rate} %`} size="small" sx={{ mt: 0.5 }} />}
            />
            <ListItemSecondaryAction>
              <Tooltip title="Modifier">
                <IconButton edge="end" size="small" onClick={() => setEditing(cat)} sx={{ mr: 1 }}>
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Supprimer">
                <IconButton edge="end" size="small" color="error" onClick={() => setDeleteTarget(cat)}>
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <CategoryForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleAdd} />
      <CategoryForm open={!!editing} onClose={() => setEditing(null)} onSubmit={handleEdit} initial={editing} />

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          Supprimer la catégorie <strong>{deleteTarget?.nom}</strong> ?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Annuler</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
