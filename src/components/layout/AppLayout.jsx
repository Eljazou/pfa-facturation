import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const PAGE_META = {
  '/dashboard':       { title: 'Tableau de bord',     subtitle: 'Vue d\'ensemble de votre activité' },
  '/admin/dashboard': { title: 'Tableau de bord',     subtitle: 'Activité agrégée' },
  '/clients':         { title: 'Clients',             subtitle: 'Gérez votre portefeuille clients' },
  '/invoices':        { title: 'Factures',            subtitle: 'Toutes vos factures en un coup d\'œil' },
  '/invoices/new':    { title: 'Nouvelle facture',    subtitle: 'Créer une nouvelle facture' },
  '/admin/articles':  { title: 'Articles & Catégories', subtitle: 'Catalogue produits' },
  '/admin/settings':  { title: 'Paramètres',          subtitle: 'Configuration de l\'application' },
  '/settings':        { title: 'Paramètres',          subtitle: 'Configuration de l\'application' },
  '/archive':         { title: 'Archives',            subtitle: 'Factures archivées par année' },
  '/profile':         { title: 'Mon profil',          subtitle: 'Gérer mon compte' },
};

function getMeta(pathname) {
  if (PAGE_META[pathname]) return PAGE_META[pathname];
  if (/^\/invoices\/[^/]+\/edit$/.test(pathname)) return { title: 'Modifier la facture', subtitle: '' };
  if (/^\/invoices\/[^/]+$/.test(pathname))      return { title: 'Détail facture',         subtitle: '' };
  return { title: 'FacturaPro', subtitle: '' };
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const meta = getMeta(location.pathname);

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        bgcolor: 'background.default',
      }}
    >
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          width: '100%',
        }}
      >
        <Topbar
          title={meta.title}
          subtitle={meta.subtitle}
          onMenuClick={() => setMobileOpen(true)}
        />

        <Box
          component="main"
          key={location.pathname}
          className="page-enter"
          sx={{
            flex: 1,
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            px: { xs: 2, md: 3, lg: 4 },
            py: { xs: 2, md: 3 },
            boxSizing: 'border-box',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
