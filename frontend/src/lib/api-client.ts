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
    includeAuth: boolean = true
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
        message: 'An error occurred',
      }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async register(data: { username: string; email: string; password: string }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }, false);
  }

  async login(data: { email: string; password: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }, false);
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async getBoards() {
    return this.request('/boards');
  }

  async getBoard(id: string) {
    return this.request(`/boards/${id}`);
  }

  async createBoard(data: { title: string; description?: string; thumbnail?: string }) {
    return this.request('/boards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBoard(id: string, data: { title?: string; description?: string; thumbnail?: string }) {
    return this.request(`/boards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteBoard(id: string) {
    return this.request(`/boards/${id}`, {
      method: 'DELETE',
    });
  }

  async getLists(boardId: string) {
    return this.request(`/boards/${boardId}/lists`);
  }

  async createList(boardId: string, data: { title: string; position?: number }) {
    return this.request(`/boards/${boardId}/lists`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateList(listId: string, data: { title?: string; position?: number }) {
    return this.request(`/boards/:boardId/lists/${listId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteList(listId: string) {
    return this.request(`/boards/:boardId/lists/${listId}`, {
      method: 'DELETE',
    });
  }

  async getCards(listId: string) {
    return this.request(`/lists/${listId}/cards`);
  }

  async createCard(listId: string, data: { 
    title: string; 
    description?: string; 
    dueDate?: string;
    tags?: string[];
    position?: number;
  }) {
    return this.request(`/lists/${listId}/cards`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCard(cardId: string, data: {
    title?: string;
    description?: string;
    dueDate?: string;
    tags?: string[];
    position?: number;
  }) {
    return this.request(`/lists/:listId/cards/${cardId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCard(cardId: string) {
    return this.request(`/lists/:listId/cards/${cardId}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient(API_URL);
