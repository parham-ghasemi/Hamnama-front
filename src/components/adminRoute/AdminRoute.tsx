import { Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../apiCalls/adminApi';
import './AdminRoute.scss';
import { AdminAccessContext } from './AdminAccessContext';
import Skeleton from '../skeleton/Skeleton';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isLoading, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/admin');

  const {
    data: access,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ['admin-access'],
    queryFn: () => adminApi.getAccess().then((res) => res.data),
    enabled: !isLoading && isAuthenticated && isDashboard,
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const accessLevel = access?.access_level ?? 0;

  if (isLoading || (isDashboard && isAuthenticated && isFetching)) {
    return (
      <div className="admin-route__loading" aria-busy="true"><Skeleton variant="rect" width={220} height={10} /><Skeleton variant="text" width={110} /></div>
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

  return (
    <AdminAccessContext.Provider value={{ accessLevel }}>
      {children}
    </AdminAccessContext.Provider>
  );
};

export default AdminRoute;
