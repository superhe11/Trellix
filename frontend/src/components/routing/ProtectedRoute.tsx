import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import type { UserRole } from "@/types";
import { SplashScreen } from "@/components/shell/splash-screen";
import { useMemo } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const status = useAuthStore((state) => state.status);

  // Memoize the result to prevent infinite re-renders
  const result = useMemo(() => {
    if (!initialized || status === "loading") {
      return <SplashScreen />;
    }

    if (!user) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (roles && !roles.includes(user.role)) {
      return <Navigate to="/boards" replace />;
    }

    return <>{children}</>;
  }, [user, initialized, status, location.pathname, children, roles]);

  return result;
}
