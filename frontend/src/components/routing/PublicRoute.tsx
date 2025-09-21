import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const isAuthenticated = useAuthStore((state) => Boolean(state.user));
  const initialized = useAuthStore((state) => state.initialized);

  if (!initialized) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/boards" replace />;
  }

  return <>{children}</>;
}
