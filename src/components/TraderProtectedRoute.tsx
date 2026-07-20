import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useTraderAuth } from '../hooks/useTraderAuth';
import { useLang, t } from '../lib/i18n';

export default function TraderProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useTraderAuth();
  const { lang } = useLang();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-tz-black/40 text-sm">
        {t(lang, { sw: 'Inapakia…', en: 'Loading…' })}
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/trader/login" replace state={{ from: location.pathname }} />;

  return <>{children}</>;
}
