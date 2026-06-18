import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, Select, MenuItem, Avatar, CircularProgress, Alert, Tooltip,
} from '@mui/material';
import { subscribeUsers, updateUserRole } from '../../services/firebaseService';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { showToast } from '../notifications/toastSlice';

const ROLE_COLOR = { admin: 'error', user: 'default' };
const ROLE_LABEL = { admin: 'Administrateur', user: 'Comptable' };

export default function UserManagementPage() {
  const dispatch = useDispatch();
  const currentUser = useSelector((s) => s.auth.user);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    const unsub = subscribeUsers((list) => {
      setUsers(list);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleRoleChange = async (uid, newRole) => {
    if (uid === currentUser?.uid) {
      dispatch(showToast({ message: 'Vous ne pouvez pas modifier votre propre rôle.', severity: 'warning' }));
      return;
    }
    setUpdating(uid);
    try {
      await updateUserRole(uid, newRole);
      dispatch(showToast({ message: `Rôle mis à jour vers « ${ROLE_LABEL[newRole]} »`, severity: 'success' }));
    } catch {
      dispatch(showToast({ message: 'Erreur lors de la mise à jour du rôle.', severity: 'error' }));
    } finally {
      setUpdating(null);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
        Gestion des utilisateurs
      </Typography>

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
                {['Utilisateur', 'Email', 'Rôle actuel', 'Changer le rôle'].map((h) => (
                  <TableCell key={h} sx={{ color: 'white', fontWeight: 600 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => {
                const isSelf = u.id === currentUser?.uid;
                const initials = (u.displayName || u.email || '?')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);
                return (
                  <TableRow key={u.id} hover sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: 12, bgcolor: 'primary.main' }}>
                          {initials}
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
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
