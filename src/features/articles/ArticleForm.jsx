import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Stack, MenuItem,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const schema = Yup.object({
  designation: Yup.string().required('Désignation requise'),
  prix_unitaire: Yup.number()
    .typeError('Doit être un nombre')
    .positive('Doit être positif')
    .required('Prix requis'),
  categorie_id: Yup.mixed().required('Catégorie requise'),
});

const EMPTY = { designation: '', prix_unitaire: '', categorie_id: '' };

export default function ArticleForm({ open, onClose, onSubmit, initial, categories = [] }) {
  const formik = useFormik({
    initialValues: initial
      ? { designation: initial.designation, prix_unitaire: initial.prix_unitaire, categorie_id: initial.categorie_id }
      : EMPTY,
    validationSchema: schema,
    enableReinitialize: true,
    onSubmit: (values, { resetForm }) => {
      onSubmit({
        ...values,
        prix_unitaire: Number(values.prix_unitaire),
        categorie_id: Number(values.categorie_id),
      });
      resetForm();
    },
  });

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial ? "Modifier l'article" : 'Nouvel article'}</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Désignation"
              name="designation"
              value={formik.values.designation}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.designation && !!formik.errors.designation}
              helperText={formik.touched.designation && formik.errors.designation}
              fullWidth
            />
            <TextField
              label="Prix unitaire (MAD)"
              name="prix_unitaire"
              type="number"
              value={formik.values.prix_unitaire}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.prix_unitaire && !!formik.errors.prix_unitaire}
              helperText={formik.touched.prix_unitaire && formik.errors.prix_unitaire}
              fullWidth
            />
            <TextField
              select
              label="Catégorie"
              name="categorie_id"
              value={formik.values.categorie_id}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.categorie_id && !!formik.errors.categorie_id}
              helperText={formik.touched.categorie_id && formik.errors.categorie_id}
              fullWidth
            >
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.nom}
                </MenuItem>
              ))}
            </TextField>
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
