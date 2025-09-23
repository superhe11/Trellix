export type UserRole = "ADMIN" | "LEAD" | "EMPLOYEE";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  managerId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Manager extends User {}

export interface BoardMember {
  id: string;
  role: BoardRole;
  canManageCards: boolean;
  user: User;
}

export type BoardRole = "OWNER" | "MANAGER" | "COLLABORATOR" | "VIEWER";

export interface CardAssignment {
  userId: string;
  user: User & { managerId?: string | null };
}

export type CardStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";

export interface Card {
  id: string;
  title: string;
  description?: string | null;
  position: number;
  status: CardStatus;
  dueDate?: string | null;
  archived?: boolean;
  listId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: User;
  assignments: CardAssignment[];
}

export interface List {
  id: string;
  title: string;
  position: number;
  boardId: string;
  cards: Card[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Board {
  id: string;
  title: string;
  description?: string | null;
  ownerId?: string;
  owner?: User;
  members: BoardMember[];
  lists: List[];
  createdAt?: string;
  updatedAt?: string;
  accessCount?: number;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error?: string;
  message?: string;
  details?: unknown;
}

export interface Paginated<T> {
  items: T[];
  total: number;
}
