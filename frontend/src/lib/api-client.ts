import {
  User,
  Board,
  List,
  Card,
  AuthResponse,
  BoardMember,
  BoardRole,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    includeAuth: boolean = true,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders(includeAuth);

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Network error. Please check your connection.',
      }));

      let errorMessage = error.message || `HTTP ${response.status}`;

      if (response.status === 401 && endpoint.includes('/auth/login')) {
        errorMessage =
          'Invalid email or password. Please check your credentials.';
      } else if (response.status === 409) {
        errorMessage = error.message || 'This resource already exists.';
      } else if (response.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }

      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async register(data: {
    username: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      false,
    );
  }

  async login(data: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      false,
    );
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async getBoards(): Promise<Board[]> {
    return this.request<Board[]>('/boards');
  }

  async getBoard(id: string): Promise<Board> {
    return this.request<Board>(`/boards/${id}`);
  }

  async createBoard(data: {
    title: string;
    description?: string;
    thumbnail?: string;
  }): Promise<Board> {
    return this.request<Board>('/boards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBoard(
    id: string,
    data: { title?: string; description?: string; thumbnail?: string },
  ): Promise<Board> {
    return this.request<Board>(`/boards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteBoard(id: string): Promise<void> {
    return this.request<void>(`/boards/${id}`, {
      method: 'DELETE',
    });
  }

  async getLists(boardId: string): Promise<List[]> {
    return this.request<List[]>(`/boards/${boardId}/lists`);
  }

  async createList(
    boardId: string,
    data: { title: string; position?: number },
  ): Promise<List> {
    return this.request<List>(`/boards/${boardId}/lists`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateList(
    listId: string,
    boardId: string,
    data: { title?: string; position?: number },
  ): Promise<List> {
    return this.request<List>(`/boards/${boardId}/lists/${listId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteList(listId: string, boardId: string): Promise<void> {
    return this.request<void>(`/boards/${boardId}/lists/${listId}`, {
      method: 'DELETE',
    });
  }

  async getCards(listId: string): Promise<Card[]> {
    return this.request<Card[]>(`/lists/${listId}/cards`);
  }

  async createCard(
    listId: string,
    data: {
      title: string;
      description?: string;
      dueDate?: string;
      tags?: string[];
      position?: number;
    },
  ): Promise<Card> {
    return this.request<Card>(`/lists/${listId}/cards`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCard(
    cardId: string,
    listId: string,
    data: {
      title?: string;
      description?: string;
      dueDate?: string;
      tags?: string[];
      position?: number;
      listId?: string;
    },
  ): Promise<Card> {
    return this.request<Card>(`/lists/${listId}/cards/${cardId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async moveCard(
    cardId: string,
    sourceListId: string,
    targetListId: string,
    position: number,
  ): Promise<Card> {
    return this.request<Card>(`/lists/${sourceListId}/cards/${cardId}`, {
      method: 'PATCH',
      body: JSON.stringify({ listId: targetListId, position }),
    });
  }

  async updateCardPosition(
    cardId: string,
    listId: string,
    position: number,
  ): Promise<Card> {
    return this.request<Card>(`/lists/${listId}/cards/${cardId}`, {
      method: 'PATCH',
      body: JSON.stringify({ position }),
    });
  }

  async updateListPosition(
    listId: string,
    boardId: string,
    position: number,
  ): Promise<List> {
    return this.request<List>(`/boards/${boardId}/lists/${listId}`, {
      method: 'PATCH',
      body: JSON.stringify({ position }),
    });
  }

  async deleteCard(cardId: string, listId: string): Promise<void> {
    return this.request<void>(`/lists/${listId}/cards/${cardId}`, {
      method: 'DELETE',
    });
  }

  async getBoardMembers(boardId: string): Promise<BoardMember[]> {
    return this.request<BoardMember[]>(`/boards/${boardId}/members`);
  }

  async inviteBoardMember(
    boardId: string,
    data: { username: string; role: BoardRole },
  ): Promise<BoardMember> {
    return this.request<BoardMember>(`/boards/${boardId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMemberRole(
    boardId: string,
    userId: string,
    data: { role: BoardRole },
  ): Promise<BoardMember> {
    return this.request<BoardMember>(`/boards/${boardId}/members/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async removeBoardMember(boardId: string, userId: string): Promise<void> {
    return this.request<void>(`/boards/${boardId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  async assignUserToCard(cardId: string, userId: string): Promise<Card> {
    return this.request<Card>(`/cards/${cardId}/assign/${userId}`, {
      method: 'POST',
    });
  }

  async unassignUserFromCard(cardId: string, userId: string): Promise<void> {
    return this.request<void>(`/cards/${cardId}/assign/${userId}`, {
      method: 'DELETE',
    });
  }

  async getCardAssignments(cardId: string): Promise<User[]> {
    return this.request<User[]>(`/cards/${cardId}/assignments`);
  }
}

export const apiClient = new ApiClient(API_URL);
