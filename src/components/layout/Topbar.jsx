import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, IconButton, Typography, Box, Menu, MenuItem,
  Avatar, Divider, Tooltip, ListItemIcon,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { logout } from '../../store/authSlice';
import NotificationBell from '../NotificationBell';
import GlobalSearch from '../GlobalSearch';

export default function Topbar({ title, subtitle, onMenuClick }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = async () => {
    setAnchorEl(null);
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <AppBar position="sticky" elevation={0} sx={{ zIndex: (t) => t.zIndex.drawer - 1 }}>
      <Toolbar sx={{ minHeight: { xs: 56, md: 64 }, gap: 1.5, px: { xs: 2, md: 3 } }}>
        <IconButton
          edge="start"
          onClick={onMenuClick}
          sx={{ display: { md: 'none' }, color: 'text.primary' }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Typography variant="h4" sx={{ fontSize: { xs: 16, md: 18 }, fontWeight: 600, lineHeight: 1.2 }} noWrap>
            {title || 'FacturaPro'}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }} noWrap>
              {subtitle}
            </Typography>
          )}
        </Box>

        <Box sx={{ flex: 1 }} />

        {/* Search — desktop only */}
        <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
          <GlobalSearch />
        </Box>

        <NotificationBell />

        <Tooltip title={user?.displayName || 'Mon compte'}>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
            <Avatar src={user?.photoURL || undefined} sx={{ bgcolor: 'primary.main', width: 34, height: 34, fontSize: 13 }}>
              {!user?.photoURL && (user?.displayName || user?.email || 'U').slice(0, 2).toUpperCase()}
            </Avatar>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: { mt: 1, minWidth: 220, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="body2" fontWeight={600} noWrap>{user?.displayName}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>{user?.email}</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }} sx={{ py: 1, fontSize: 14 }}>
            <ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon>
            Mon profil
          </MenuItem>
          <MenuItem onClick={handleLogout} sx={{ py: 1, fontSize: 14, color: 'error.main' }}>
            <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
            Déconnexion
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
