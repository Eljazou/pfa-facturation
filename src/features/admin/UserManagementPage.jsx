import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, Select, MenuItem, Avatar, CircularProgress, Alert, Tooltip,
  Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Stack, InputAdornment,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { subscribeUsers, updateUserRole, adminCreateUser, adminUpdateUser, adminDeleteUser } from '../../services/firebaseService';
import { useSelector, useDispatch } from 'react-redux';
import { showToast } from '../notifications/toastSlice';

const ROLE_COLOR = { admin: 'error', user: 'default' };
const ROLE_LABEL = { admin: 'Administrateur', user: 'Comptable' };

const EMPTY_CREATE = { displayName: '', email: '', password: '', confirmPassword: '', role: 'user' };
const EMPTY_EDIT   = { displayName: '', role: 'user' };

export default function UserManagementPage() {
  const dispatch = useDispatch();
  const currentUser = useSelector((s) => s.auth.user);
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [updating, setUpdating]   = useState(null);

  // Create dialog
  const [createOpen, setCreateOpen]   = useState(false);
  const [createForm, setCreateForm]   = useState(EMPTY_CREATE);
  const [createLoading, setCreateLoading] = useState(false);
  const [showPwd, setShowPwd]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [createErrors, setCreateErrors] = useState({});

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Edit dialog
  const [editOpen, setEditOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm]   = useState(EMPTY_EDIT);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    const unsub = subscribeUsers((list) => {
      setUsers(list);
      setLoading(false);
    });
    return unsub;
  }, []);

  /* ── Role quick-change (table dropdown) ───────────────────────────────────── */
  const handleRoleChange = async (uid, newRole) => {
    if (uid === currentUser?.uid) {
      dispatch(showToast({ message: 'Vous ne pouvez pas modifier votre propre rôle.', severity: 'warning' }));
      return;
    }
    setUpdating(uid);
    try {
      await updateUserRole(uid, newRole);
      dispatch(showToast({ message: `Rôle mis à jour : « ${ROLE_LABEL[newRole]} »`, severity: 'success' }));
    } catch {
      dispatch(showToast({ message: 'Erreur lors de la mise à jour du rôle.', severity: 'error' }));
    } finally {
      setUpdating(null);
    }
  };

  /* ── Create user ──────────────────────────────────────────────────────────── */
  const validateCreate = () => {
    const errs = {};
    if (!createForm.displayName.trim()) errs.displayName = 'Nom requis';
    if (!createForm.email.trim() || !/\S+@\S+\.\S+/.test(createForm.email)) errs.email = 'Email invalide';
    if (createForm.password.length < 6) errs.password = 'Min 6 caractères';
    if (createForm.password !== createForm.confirmPassword) errs.confirmPassword = 'Les mots de passe ne correspondent pas';
    return errs;
  };

  const handleCreate = async () => {
    const errs = validateCreate();
    if (Object.keys(errs).length) { setCreateErrors(errs); return; }
    setCreateLoading(true);
    try {
      await adminCreateUser(createForm.email, createForm.password, createForm.displayName, createForm.role);
      dispatch(showToast({ message: `Utilisateur « ${createForm.displayName} » créé avec succès.`, severity: 'success' }));
      setCreateOpen(false);
      setCreateForm(EMPTY_CREATE);
      setCreateErrors({});
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'Cet email est déjà utilisé.'
        : err.message || 'Erreur lors de la création.';
      dispatch(showToast({ message: msg, severity: 'error' }));
    } finally {
      setCreateLoading(false);
    }
  };

  /* ── Delete user ─────────────────────────────────────────────────────────── */
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await adminDeleteUser(deleteTarget.id);
      dispatch(showToast({ message: `Utilisateur « ${deleteTarget.displayName || deleteTarget.email} » supprimé.`, severity: 'success' }));
      setDeleteTarget(null);
    } catch {
      dispatch(showToast({ message: 'Erreur lors de la suppression.', severity: 'error' }));
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ── Edit user ────────────────────────────────────────────────────────────── */
  const openEdit = (u) => {
    setEditTarget(u);
    setEditForm({ displayName: u.displayName || '', role: u.role || 'user' });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editForm.displayName.trim()) {
      dispatch(showToast({ message: 'Le nom ne peut pas être vide.', severity: 'warning' }));
      return;
    }
    setEditLoading(true);
    try {
      await adminUpdateUser(editTarget.id, { displayName: editForm.displayName, role: editForm.role });
      dispatch(showToast({ message: 'Utilisateur mis à jour.', severity: 'success' }));
      setEditOpen(false);
    } catch {
      dispatch(showToast({ message: 'Erreur lors de la mise à jour.', severity: 'error' }));
    } finally {
      setEditLoading(false);
    }
  };

  const initials = (u) =>
    (u.displayName || u.email || '?')
      .split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Box>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Gestion des utilisateurs
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => { setCreateForm(EMPTY_CREATE); setCreateErrors({}); setCreateOpen(true); }}
        >
          Nouvel utilisateur
        </Button>
      </Box>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : users.length === 0 ? (
        <Alert severity="info">Aucun utilisateur trouvé.</Alert>
      ) : (
        <Paper>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                {['Utilisateur', 'Email', 'Rôle actuel', 'Changer le rôle', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ color: 'white', fontWeight: 600 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => {
                const isSelf = u.id === currentUser?.uid;
                return (
                  <TableRow key={u.id} hover sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: 12, bgcolor: 'primary.main' }}>
                          {initials(u)}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                            {u.displayName || '—'}
                          </Typography>
                          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                            {isSelf ? '(vous)' : u.id.slice(0, 8) + '…'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{u.email || '—'}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={ROLE_LABEL[u.role] || u.role}
                        color={ROLE_COLOR[u.role] || 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {isSelf ? (
                        <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>
                      ) : (
                        <Tooltip title={updating === u.id ? 'Mise à jour…' : ''} placement="top">
                          <Select
                            size="small"
                            value={u.role || 'user'}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            disabled={updating === u.id}
                            sx={{ minWidth: 150, fontSize: 13 }}
                          >
                            <MenuItem value="user">Comptable</MenuItem>
                            <MenuItem value="admin">Administrateur</MenuItem>
                          </Select>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Modifier">
                        <IconButton size="small" onClick={() => openEdit(u)} sx={{ color: 'primary.main' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {!isSelf && (
                        <Tooltip title="Supprimer">
                          <IconButton size="small" onClick={() => setDeleteTarget(u)} sx={{ color: 'error.main', ml: 0.5 }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* ── Create Dialog ──────────────────────────────────────────────────── */}
      <Dialog
        open={createOpen}
        onClose={() => !createLoading && setCreateOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Créer un utilisateur</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nom complet"
              fullWidth
              value={createForm.displayName}
              onChange={(e) => setCreateForm((f) => ({ ...f, displayName: e.target.value }))}
              error={!!createErrors.displayName}
              helperText={createErrors.displayName}
              disabled={createLoading}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={createForm.email}
              onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
              error={!!createErrors.email}
              helperText={createErrors.email}
              disabled={createLoading}
            />
            <TextField
              label="Mot de passe"
              type={showPwd ? 'text' : 'password'}
              fullWidth
              value={createForm.password}
              onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
              error={!!createErrors.password}
              helperText={createErrors.password}
              disabled={createLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPwd((v) => !v)}>
                      {showPwd ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Confirmer le mot de passe"
              type={showConfirm ? 'text' : 'password'}
              fullWidth
              value={createForm.confirmPassword}
              onChange={(e) => setCreateForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              error={!!createErrors.confirmPassword}
              helperText={createErrors.confirmPassword}
              disabled={createLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowConfirm((v) => !v)}>
                      {showConfirm ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Select
              value={createForm.role}
              onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))}
              disabled={createLoading}
              size="small"
              fullWidth
            >
              <MenuItem value="user">Comptable</MenuItem>
              <MenuItem value="admin">Administrateur</MenuItem>
            </Select>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} variant="outlined" disabled={createLoading}>
            Annuler
          </Button>
          <Button onClick={handleCreate} variant="contained" disabled={createLoading}>
            {createLoading ? <CircularProgress size={18} color="inherit" /> : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirm Dialog ──────────────────────────────────────────── */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => !deleteLoading && setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Supprimer l'utilisateur</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 1 }}>
            Cette action est irréversible.
          </Alert>
          <Typography sx={{ fontSize: 14 }}>
            Voulez-vous vraiment supprimer{' '}
            <strong>{deleteTarget?.displayName || deleteTarget?.email}</strong> ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} variant="outlined" disabled={deleteLoading}>
            Annuler
          </Button>
          <Button onClick={handleDelete} variant="contained" color="error" disabled={deleteLoading}>
            {deleteLoading ? <CircularProgress size={18} color="inherit" /> : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Edit Dialog ────────────────────────────────────────────────────── */}
      <Dialog
        open={editOpen}
        onClose={() => !editLoading && setEditOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Modifier l'utilisateur</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Email"
              value={editTarget?.email || ''}
              fullWidth
              disabled
              size="small"
            />
            <TextField
              label="Nom complet"
              fullWidth
              value={editForm.displayName}
              onChange={(e) => setEditForm((f) => ({ ...f, displayName: e.target.value }))}
              disabled={editLoading}
            />
            <Select
              value={editForm.role}
              onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
              disabled={editLoading || editTarget?.id === currentUser?.uid}
              size="small"
              fullWidth
            >
              <MenuItem value="user">Comptable</MenuItem>
              <MenuItem value="admin">Administrateur</MenuItem>
            </Select>
            {editTarget?.id === currentUser?.uid && (
              <Alert severity="info" sx={{ fontSize: 12 }}>
                Vous ne pouvez pas modifier votre propre rôle.
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} variant="outlined" disabled={editLoading}>
            Annuler
          </Button>
          <Button onClick={handleEdit} variant="contained" disabled={editLoading}>
            {editLoading ? <CircularProgress size={18} color="inherit" /> : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
