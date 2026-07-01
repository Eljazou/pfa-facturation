import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Avatar, Tooltip, IconButton, Divider,
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LogoutIcon from '@mui/icons-material/Logout';
import { userNavItems, adminNavItems } from './navConfig';
import { tokens } from '../../theme';
import { logout } from '../../store/authSlice';

const DRAWER_WIDTH_OPEN = 260;
const DRAWER_WIDTH_COLLAPSED = 72;
const STORAGE_KEY = 'pfa.sidebar.collapsed';

export default function Sidebar({ mobileOpen, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((s) => s.auth);
  const pendingCount = useSelector((s) => s.notifications?.pendingCount || 0);

  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0'); } catch { /* ignore */ }
  }, [collapsed]);

  const navItems = user?.role === 'admin' ? adminNavItems : userNavItems;
  const isAdmin = user?.role === 'admin';

  // Exact-match wins, fallback longest parent
  const activePath = (() => {
    const exact = navItems.find((n) => n.path === location.pathname);
    if (exact) return exact.path;
    return navItems
      .filter((n) => location.pathname.startsWith(n.path + '/'))
      .sort((a, b) => b.path.length - a.path.length)[0]?.path || null;
  })();

  // Group items into sections
  const userItems  = navItems.filter((n) => !n.path.startsWith('/admin') && n.path !== '/archive' && n.path !== '/admin/settings');
  const adminItems = navItems.filter((n) => n.path.startsWith('/admin') || n.path === '/archive');

  const isMobile = mobileOpen !== undefined && mobileOpen !== null;
  const width = isMobile ? DRAWER_WIDTH_OPEN : (collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH_OPEN);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const NavItem = ({ item, active }) => {
    const Icon = item.icon;
    const button = (
      <ListItemButton
        onClick={() => { navigate(item.path); onClose?.(); }}
        sx={{
          minHeight: 44,
          mx: collapsed && !isMobile ? 0.75 : 1.25,
          my: 0.25,
          px: collapsed && !isMobile ? 1.25 : 1.5,
          borderRadius: '8px',
          color: active ? '#FFFFFF' : 'rgba(248,250,252,0.75)',
          backgroundColor: active ? tokens.color.primary : 'transparent',
          transition: 'background-color 0.15s ease, color 0.15s ease',
          justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
          '&:hover': {
            backgroundColor: active ? tokens.color.primaryDark : 'rgba(255,255,255,0.06)',
            color: '#FFFFFF',
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: collapsed && !isMobile ? 0 : 36,
            color: 'inherit',
            justifyContent: 'center',
          }}
        >
          <Icon sx={{ fontSize: 20 }} />
        </ListItemIcon>
        {(!collapsed || isMobile) && (
          <>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 500 }}
            />
          </>
        )}
      </ListItemButton>
    );

    if (collapsed && !isMobile) {
      return <Tooltip title={item.label} placement="right" arrow>{button}</Tooltip>;
    }
    return button;
  };

  const SectionLabel = ({ children }) =>
    !collapsed || isMobile ? (
      <Typography
        variant="overline"
        sx={{ px: 2.5, mt: 2, mb: 0.5, color: 'rgba(248,250,252,0.45)', fontSize: 10, letterSpacing: '0.08em', display: 'block' }}
      >
        {children}
      </Typography>
    ) : <Box sx={{ height: 12 }} />;

  const content = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', color: '#F8FAFC' }}>
      {/* Logo + collapse */}
      <Box
        sx={{
          height: 64, display: 'flex', alignItems: 'center',
          px: collapsed && !isMobile ? 0 : 2,
          justifyContent: collapsed && !isMobile ? 'center' : 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: 1.25, bgcolor: tokens.color.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ReceiptLongIcon sx={{ color: '#FFFFFF', fontSize: 18 }} />
          </Box>
          {(!collapsed || isMobile) && (
            <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700, letterSpacing: '-0.01em' }}>
              FacturaPro
            </Typography>
          )}
        </Box>
        {!isMobile && (
          <IconButton
            size="small"
            onClick={() => setCollapsed((v) => !v)}
            sx={{
              color: 'rgba(248,250,252,0.55)',
              '&:hover': { color: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.06)' },
              ...(collapsed && { position: 'absolute', right: -12, top: 16, bgcolor: tokens.color.bgSidebar, border: '1px solid rgba(255,255,255,0.08)' }),
            }}
          >
            {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
          </IconButton>
        )}
      </Box>

      {/* Nav */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', pb: 2 }}>
        <SectionLabel>Menu</SectionLabel>
        <List sx={{ p: 0 }}>
          {userItems.map((item) => (
            <NavItem key={item.path} item={item} active={item.path === activePath} />
          ))}
        </List>

        {adminItems.length > 0 && (
          <>
            <SectionLabel>{isAdmin ? 'Administration' : 'Plus'}</SectionLabel>
            <List sx={{ p: 0 }}>
              {adminItems.map((item) => (
                <NavItem key={item.path} item={item} active={item.path === activePath} />
              ))}
            </List>
          </>
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

      {/* User block */}
      <Box
        sx={{
          p: collapsed && !isMobile ? 1 : 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
        }}
      >
        <Avatar
          src={user?.photoURL || undefined}
          onClick={() => navigate('/profile')}
          sx={{
            width: 36, height: 36, fontSize: 13, bgcolor: tokens.color.primary, cursor: 'pointer',
            '&:hover': { opacity: 0.85 },
          }}
        >
          {!user?.photoURL && (user?.displayName || user?.email || 'U').slice(0, 2).toUpperCase()}
        </Avatar>
        {(!collapsed || isMobile) && (
          <>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF', lineHeight: 1.3 }} noWrap>
                {user?.displayName || 'Utilisateur'}
              </Typography>
              <Typography sx={{ fontSize: 11, color: 'rgba(248,250,252,0.55)' }} noWrap>
                {isAdmin ? 'Administrateur' : 'Comptable'}
              </Typography>
            </Box>
            <Tooltip title="Déconnexion">
              <IconButton
                size="small"
                onClick={handleLogout}
                sx={{ color: 'rgba(248,250,252,0.55)', '&:hover': { color: tokens.color.error, bgcolor: 'rgba(220,38,38,0.1)' } }}
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={!!mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH_OPEN, bgcolor: tokens.color.bgSidebar, borderRight: 'none' },
        }}
      >
        {content}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width,
          flexShrink: 0,
          transition: 'width 0.25s ease',
          '& .MuiDrawer-paper': {
            width,
            bgcolor: tokens.color.bgSidebar,
            borderRight: 'none',
            transition: 'width 0.25s ease',
            overflow: 'visible',
            position: 'fixed',
            height: '100vh',
          },
        }}
        open
      >
        {content}
      </Drawer>
    </>
  );
}

export const SIDEBAR_WIDTH_OPEN = DRAWER_WIDTH_OPEN;
export const SIDEBAR_WIDTH_COLLAPSED = DRAWER_WIDTH_COLLAPSED;
// Backward compat for any imports of DRAWER_WIDTH
export { DRAWER_WIDTH_OPEN as DRAWER_WIDTH };
