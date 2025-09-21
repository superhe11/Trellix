import { apiClient } from "@/lib/api-client";
import type { Board, BoardMember } from "@/types";

export interface CreateBoardPayload {
  title: string;
  description?: string;
  memberIds?: string[];
  ownerId?: string;
}

export interface UpdateBoardPayload {
  title?: string;
  description?: string;
}

export interface UpdateBoardMembersPayload {
  members: Array<{ userId: string; role?: BoardMember["role"]; canManageCards?: boolean }>;
}

export async function getBoards() {
  const response = await apiClient.get<{ boards: Board[] }>("/boards");
  return response.data.boards;
}

export async function getBoard(boardId: string) {
  const response = await apiClient.get<{ board: Board }>(`/boards/${boardId}`);
  return response.data.board;
}

export async function createBoard(payload: CreateBoardPayload) {
  const response = await apiClient.post<{ board: Board }>("/boards", payload);
  return response.data.board;
}

export async function updateBoard(boardId: string, payload: UpdateBoardPayload) {
  const response = await apiClient.patch<{ board: Board }>(`/boards/${boardId}`, payload);
  return response.data.board;
}

export async function updateBoardMembers(boardId: string, payload: UpdateBoardMembersPayload) {
  const response = await apiClient.put<{ board: Board }>(`/boards/${boardId}/members`, payload);
  return response.data.board;
}

export async function deleteBoard(boardId: string) {
  await apiClient.delete(`/boards/${boardId}`);
}
