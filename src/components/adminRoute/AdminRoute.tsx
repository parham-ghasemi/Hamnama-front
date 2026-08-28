import { Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../apiCalls/adminApi';
import './AdminRoute.scss';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isLoading, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/admin');

  const { isFetching, isError, error } = useQuery({
    queryKey: ['admin-access'],
    queryFn: () => adminApi.getDashboard(),
    enabled: !isLoading && isAuthenticated,
    retry: false,
  });

  if (isLoading || (isAuthenticated && isFetching) && isDashboard) {
    return (
      <div className="admin-route__loading">
        <div className="admin-route__loading__spinner" />
        <p>در حال بررسی دسترسی...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (isError) {
    const axiosError = error as AxiosError<{ message?: string }>;
    const status = axiosError.response?.status;

    if (isDashboard) {
      if (status === 401) {
        logout();
        return <Navigate to="/auth" replace />;
      }

      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default AdminRoute;
