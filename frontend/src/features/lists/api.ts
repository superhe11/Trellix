import { apiClient } from "@/lib/api-client";
import type { List } from "@/types";

export interface CreateListPayload {
  title: string;
  position?: number;
}

export interface UpdateListPayload {
  title?: string;
  position?: number;
}

export async function createList(boardId: string, payload: CreateListPayload) {
  const response = await apiClient.post<{ list: List }>(`/boards/${boardId}/lists`, payload);
  return response.data.list;
}

export async function updateList(listId: string, payload: UpdateListPayload) {
  const response = await apiClient.patch<{ list: List }>(`/lists/${listId}`, payload);
  return response.data.list;
}

export async function deleteList(listId: string) {
  await apiClient.delete(`/lists/${listId}`);
}
