import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Toolbar, Typography, Divider, Avatar, Chip, Badge,
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { userNavItems, adminNavItems } from './navConfig';

const DRAWER_WIDTH = 240;

export default function Sidebar({ mobileOpen, onClose, variant = 'permanent' }) {
  const { user } = useSelector((s) => s.auth);
  const pendingCount = useSelector((s) => s.notifications?.pendingCount || 0);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = user?.role === 'admin' ? adminNavItems : userNavItems;
  const isAdmin = user?.role === 'admin';

  const content = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ px: 2 }}>
        <ReceiptLongIcon sx={{ color: 'primary.main', mr: 1 }} />
        <Typography variant="h6" noWrap>PFA Facturation</Typography>
      </Toolbar>

      <Divider />

      {/* User info */}
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: 14 }}>
          {user?.displayName?.[0]?.toUpperCase() ?? 'U'}
        </Avatar>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="body2" fontWeight={600} noWrap>{user?.displayName}</Typography>
          <Chip
            label={user?.role === 'admin' ? 'Admin' : 'Comptable'}
            size="small"
            color={user?.role === 'admin' ? 'secondary' : 'primary'}
            sx={{ height: 18, fontSize: 10 }}
          />
        </Box>
      </Box>

      <Divider sx={{ mb: 1 }} />

      <List sx={{ flex: 1, px: 1 }}>
        {navItems.map(({ label, icon: Icon, path }) => {
          const active = location.pathname === path ||
            (path !== '/dashboard' && path !== '/admin/dashboard' && location.pathname.startsWith(path));
          return (
            <ListItem key={path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => { navigate(path); onClose?.(); }}
                selected={active}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                    '& .MuiListItemIcon-root': { color: 'white' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 38 }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={label} primaryTypographyProps={{ fontSize: 14 }} />
                {isAdmin && path === '/invoices' && pendingCount > 0 && (
                  <Badge badgeContent={pendingCount} color="error" sx={{ mr: 1.5 }} />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
      >
        {content}
      </Drawer>

      {/* Desktop permanent drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            position: 'fixed',
            height: '100vh',
            overflowY: 'auto',
          },
        }}
        open
      >
        {content}
      </Drawer>
    </>
  );
}

export { DRAWER_WIDTH };
