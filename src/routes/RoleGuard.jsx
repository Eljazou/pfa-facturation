import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

// roles: string | string[] — allowed roles
export default function RoleGuard({ roles, children }) {
  const { user } = useSelector((s) => s.auth);
  const allowed = Array.isArray(roles) ? roles : [roles];

  if (!user || !allowed.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
