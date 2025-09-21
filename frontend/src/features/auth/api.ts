import { apiClient } from "@/lib/api-client";
import type { User } from "@/types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  fullName: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export async function login(payload: LoginPayload) {
  const response = await apiClient.post<AuthResponse>("/auth/login", payload);
  return response.data;
}

export async function register(payload: RegisterPayload) {
  const response = await apiClient.post<AuthResponse>("/auth/register", payload);
  return response.data;
}

export async function refreshSession() {
  const response = await apiClient.post<AuthResponse>("/auth/refresh");
  return response.data;
}

export async function logout() {
  await apiClient.post("/auth/logout");
}

export async function fetchProfile() {
  const response = await apiClient.get<{ user: User }>("/auth/me");
  return response.data.user;
}
