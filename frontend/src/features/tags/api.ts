import { apiClient } from "@/lib/api-client";
import type { Tag } from "@/types";

export interface CreateTagPayload {
  name: string;
  color: string;
}

export async function getBoardTags(boardId: string) {
  const response = await apiClient.get<{ tags: Tag[] }>(`/boards/${boardId}/tags`);
  return response.data.tags;
}

export async function createBoardTag(boardId: string, payload: CreateTagPayload) {
  const response = await apiClient.post<{ tag: Tag }>(`/boards/${boardId}/tags`, payload);
  return response.data.tag;
}