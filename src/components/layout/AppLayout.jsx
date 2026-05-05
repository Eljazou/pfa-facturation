import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import Sidebar, { DRAWER_WIDTH } from './Sidebar';
import Topbar from './Topbar';

const pageTitles = {
  '/dashboard': 'Tableau de bord',
  '/clients': 'Gestion des clients',
  '/invoices': 'Factures',
  '/invoices/new': 'Nouvelle facture',
  '/admin/dashboard': 'Tableau de bord Admin',
  '/admin/articles': 'Articles & Catégories',
  '/admin/settings': 'Paramètres',
};

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const title = pageTitles[location.pathname] ?? 'PFA Facturation';

  return (
    <Box sx={{ display: 'flex' }}>
      <Topbar title={title} onMenuClick={() => setMobileOpen(true)} />
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          minWidth: 0,
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Toolbar /> {/* spacer under fixed AppBar */}
        <Outlet />
      </Box>
    </Box>
  );
}
