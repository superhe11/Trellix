import { apiClient } from "@/lib/api-client";
import type { Card, CardStatus } from "@/types";
import type { Tag } from "@/types";

export interface CreateCardPayload {
  title: string;
  description?: string;
  position?: number;
  assigneeIds?: string[];
  dueDate?: string;
}

export interface UpdateCardPayload {
  title?: string;
  description?: string | null;
  status?: CardStatus;
  position?: number;
  listId?: string;
  assigneeIds?: string[];
  dueDate?: string | null;
  archived?: boolean;
}

export async function createCard(listId: string, payload: CreateCardPayload) {
  const response = await apiClient.post<{ card: Card }>(`/lists/${listId}/cards`, payload);
  return response.data.card;
}

export async function updateCard(cardId: string, payload: UpdateCardPayload) {
  const response = await apiClient.patch<{ card: Card }>(`/cards/${cardId}`, payload);
  return response.data.card;
}

export async function deleteCard(cardId: string) {
  await apiClient.delete(`/cards/${cardId}`);
}

export async function getCard(cardId: string) {
  const response = await apiClient.get<{ card: Card }>(`/cards/${cardId}`);
  return response.data.card;
}

export async function attachTag(cardId: string, tagId: string) {
  const response = await apiClient.post<{ card: Card }>(`/cards/${cardId}/tags`, { tagId });
  return response.data.card;
}

export async function detachTag(cardId: string, tagId: string) {
  const response = await apiClient.delete<{ card: Card }>(`/cards/${cardId}/tags/${tagId}`);
  return response.data.card;
}

export async function reorderTags(cardId: string, tagIds: string[]) {
  const response = await apiClient.patch<{ card: Card }>(`/cards/${cardId}/tags/reorder`, { tagIds });
  return response.data.card;
}

export async function toggleFavoriteTag(cardId: string, tagId: string, isFavorite: boolean) {
  const response = await apiClient.patch<{ card: Card }>(`/cards/${cardId}/tags/${tagId}/favorite`, { isFavorite });
  return response.data.card;
}
