import { create } from "zustand";
import type { User } from "@/types";
import { extractErrorMessage } from "@/utils/error";
import {
  login as loginRequest,
  register as registerRequest,
  refreshSession,
  logout as logoutRequest,
  fetchProfile,
} from "@/features/auth/api";
import type { LoginPayload, RegisterPayload } from "@/features/auth/api";
import { configureApiClient } from "@/lib/api-client";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  status: "idle" | "loading" | "authenticated" | "error";
  initialized: boolean;
  error?: string;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<string | null>;
  initialize: () => Promise<void>;
  setAccessToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
}

let isRefreshingAuth = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  status: "idle",
  initialized: false,
  async login(payload) {
    set({ status: "loading", error: undefined });
    try {
      const { user, accessToken } = await loginRequest(payload);
      set({ user, accessToken, status: "authenticated", initialized: true });
    } catch (error) {
      set({ status: "error", error: extractErrorMessage(error) });
      throw error;
    }
  },
  async register(payload) {
    set({ status: "loading", error: undefined });
    try {
      const { user, accessToken } = await registerRequest(payload);
      set({ user, accessToken, status: "authenticated", initialized: true });
    } catch (error) {
      set({ status: "error", error: extractErrorMessage(error) });
      throw error;
    }
  },
  async logout() {
    try {
      await logoutRequest();
    } catch (error) {
      console.warn("Logout failed", error);
    } finally {
      set({ user: null, accessToken: null, status: "idle" });
    }
  },
  async refresh() {
    // Prevent multiple simultaneous refresh attempts
    if (isRefreshingAuth) {
      return null;
    }
    
    isRefreshingAuth = true;
    try {
      const { user, accessToken } = await refreshSession();
      set({ user, accessToken, status: "authenticated", initialized: true });
      return accessToken;
    } catch (error) {
      set({ status: "idle", accessToken: null, user: null, initialized: true });
      return null;
    } finally {
      isRefreshingAuth = false;
    }
  },
  async initialize() {
    const state = get();
    
    if (state.initialized) {
      return;
    }
    
    try {
      const token = await get().refresh();
      if (!token) {
        set({ initialized: true, status: "idle" });
      }
    } catch (error) {
      set({ initialized: true, status: "idle" });
    }
  },
  setAccessToken(token) {
    set({ accessToken: token });
  },
  setUser(user) {
    set({ user });
  },
}));

configureApiClient({
  getAccessToken: () => useAuthStore.getState().accessToken,
  onUnauthorized: async () => {
    // If we're already refreshing or not initialized, don't attempt refresh
    if (isRefreshingAuth || !useAuthStore.getState().initialized) {
      return null;
    }
    
    const token = await useAuthStore.getState().refresh();
    if (!token) {
      await useAuthStore.getState().logout();
    }
    return token;
  },
});

export async function ensureProfile() {
  const state = useAuthStore.getState();
  if (state.user) {
    return state.user;
  }
  const profile = await fetchProfile();
  useAuthStore.setState({ user: profile, status: "authenticated" });
  return profile;
}
