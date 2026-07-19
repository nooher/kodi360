import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-tz-black/40 text-sm">
        Inapakia…
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/officer/login" replace />;

  return <>{children}</>;
}
