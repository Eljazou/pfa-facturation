import { Suspense, lazy } from 'react';
import { useSelector } from 'react-redux';
import { Box, CircularProgress } from '@mui/material';

const UserDashboard  = lazy(() => import('./UserDashboard'));
const AdminDashboard = lazy(() => import('./AdminDashboard'));

const Loader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
    <CircularProgress />
  </Box>
);

export default function Dashboard() {
  const user = useSelector((s) => s.auth.user);
  const isAdmin = user?.role === 'admin';
  return (
    <Suspense fallback={<Loader />}>
      {isAdmin ? <AdminDashboard /> : <UserDashboard />}
    </Suspense>
  );
}
