export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface List {
  id: string;
  title: string;
  position: number;
  boardId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  tags: string[] | null;
  position: number;
  listId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
