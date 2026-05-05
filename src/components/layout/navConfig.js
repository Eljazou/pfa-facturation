import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import InventoryIcon from '@mui/icons-material/Inventory';
import SettingsIcon from '@mui/icons-material/Settings';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AddBoxIcon from '@mui/icons-material/AddBox';

export const userNavItems = [
  { label: 'Tableau de bord', icon: DashboardIcon, path: '/dashboard' },
  { label: 'Clients', icon: PeopleIcon, path: '/clients' },
  { label: 'Factures', icon: ReceiptLongIcon, path: '/invoices' },
  { label: 'Nouvelle facture', icon: AddBoxIcon, path: '/invoices/new' },
];

export const adminNavItems = [
  { label: 'Tableau de bord', icon: AdminPanelSettingsIcon, path: '/admin/dashboard' },
  { label: 'Toutes les factures', icon: ReceiptLongIcon, path: '/invoices' },
  { label: 'Articles & Catégories', icon: InventoryIcon, path: '/admin/articles' },
  { label: 'Paramètres', icon: SettingsIcon, path: '/admin/settings' },
];
