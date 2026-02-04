import { ReactNode } from "react";
import { Redirect, useLocation } from "wouter";
import { useAuth } from "@/lib/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  requireSubscription?: boolean;
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        <p className="text-white/60 text-sm">Loading...</p>
      </div>
    </div>
  );
}

export function ProtectedRoute({ 
  children, 
  requireSubscription = true 
}: ProtectedRouteProps) {
  const { isAuthenticated, hasActiveSubscription, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(location);
    return <Redirect to={`/login?returnTo=${returnUrl}`} />;
  }

  if (requireSubscription && !hasActiveSubscription) {
    const returnUrl = encodeURIComponent(location);
    return <Redirect to={`/plans?returnTo=${returnUrl}&message=subscribe`} />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
