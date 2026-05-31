import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import Loader from './Loader';

const ProtectedRoute = ({ children, role }) => {
  const location = useLocation();
  const { isAuthenticated, user, isAuthReady } = useAuthStore();

  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-20 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
          <Loader text="Verifying session..." />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return children;
};

export default ProtectedRoute;
