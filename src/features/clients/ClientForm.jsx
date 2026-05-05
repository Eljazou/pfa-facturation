import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Stack,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const schema = Yup.object({
  nom: Yup.string().required('Nom requis'),
  email: Yup.string().email('Email invalide').required('Email requis'),
  tel: Yup.string()
    .matches(/^[0-9+\s\-()]{7,15}$/, 'Numéro invalide')
    .required('Téléphone requis'),
  adresse: Yup.string().required('Adresse requise'),
});

const EMPTY = { nom: '', email: '', tel: '', adresse: '' };

export default function ClientForm({ open, onClose, onSubmit, initial }) {
  const formik = useFormik({
    initialValues: initial ? { nom: initial.nom, email: initial.email, tel: initial.tel, adresse: initial.adresse } : EMPTY,
    validationSchema: schema,
    enableReinitialize: true,
    onSubmit: (values, { resetForm }) => {
      onSubmit(values);
      resetForm();
    },
  });

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial ? 'Modifier le client' : 'Nouveau client'}</DialogTitle>
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
              label="Email"
              name="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && !!formik.errors.email}
              helperText={formik.touched.email && formik.errors.email}
              fullWidth
            />
            <TextField
              label="Téléphone"
              name="tel"
              value={formik.values.tel}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.tel && !!formik.errors.tel}
              helperText={formik.touched.tel && formik.errors.tel}
              fullWidth
            />
            <TextField
              label="Adresse"
              name="adresse"
              value={formik.values.adresse}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.adresse && !!formik.errors.adresse}
              helperText={formik.touched.adresse && formik.errors.adresse}
              multiline
              rows={2}
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
