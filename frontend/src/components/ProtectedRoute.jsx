import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ adminOnly = false }) => {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (adminOnly && user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

    return <Outlet />;
};

export const PublicRoute = () => {
    const { isAuthenticated, isLoading, user } = useAuth();
    if (isLoading) return null;
    if (isAuthenticated) {
        return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
    }
    return <Outlet />;
};
