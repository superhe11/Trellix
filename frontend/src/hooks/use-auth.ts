import { useAuthStore } from "@/store/auth-store";

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const logout = useAuthStore((state) => state.logout);

  return {
    user,
    status,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };
}
