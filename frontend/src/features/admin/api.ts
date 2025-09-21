import { apiClient } from "@/lib/api-client";
import type { User, UserRole } from "@/types";

export interface UserInput {
  email: string;
  fullName: string;
  password?: string;
  role?: UserRole;
  managerId?: string | null;
}

export async function listUsers(params?: { role?: UserRole; search?: string; managerId?: string }) {
  // Omit empty-string params to avoid backend 400 on validation
  const cleanedParams = Object.fromEntries(
    Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );
  const response = await apiClient.get<{ users: (User & { subordinates?: User[]; manager?: User })[] }>(
    "/admin/users",
    {
      params: cleanedParams,
    }
  );
  return response.data.users;
}

export async function createUser(payload: { email: string; fullName: string; password: string; role: UserRole; managerId?: string | null }) {
  const response = await apiClient.post<{ user: User }>("/admin/users", payload);
  return response.data.user;
}

export async function updateUser(userId: string, payload: Partial<UserInput>) {
  const response = await apiClient.patch<{ user: User }>(`/admin/users/${userId}`, payload);
  return response.data.user;
}

export async function deleteUser(userId: string) {
  await apiClient.delete(`/admin/users/${userId}`);
}