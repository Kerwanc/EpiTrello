export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export enum BoardRole {
  OWNER = 'owner',
  MODERATOR = 'moderator',
  VISITOR = 'visitor',
}

export interface BoardMember {
  id: string;
  boardId: string;
  userId: string;
  role: BoardRole;
  user: User;
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
  userRole?: BoardRole;
  memberCount?: number;
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
  assignedUsers?: User[];
  createdAt: string;
  updatedAt: string;
}

export interface CommentAuthor {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
}

export interface Comment {
  id: string;
  content: string;
  cardId: string;
  authorId: string;
  author: CommentAuthor;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export enum NotificationType {
  BOARD_INVITATION = 'BOARD_INVITATION',
  CARD_ASSIGNMENT = 'CARD_ASSIGNMENT',
  ROLE_CHANGE = 'ROLE_CHANGE',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  relatedBoardId: string | null;
  relatedCardId: string | null;
  isRead: boolean;
  createdAt: string;
}
