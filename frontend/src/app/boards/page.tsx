'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/AuthProvider';
import { apiClient } from '@/lib/api-client';
import { Board } from '@/types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';

export default function BoardsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchBoards();
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchBoards = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getBoards();
      setBoards(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch boards');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Board title is required');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      const newBoard = await apiClient.createBoard({
        title: formData.title,
        description: formData.description || undefined,
      });
      setBoards([...boards, newBoard]);
      setFormData({ title: '', description: '' });
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create board');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    if (!confirm('Are you sure you want to delete this board?')) {
      return;
    }

    try {
      await apiClient.deleteBoard(boardId);
      setBoards(boards.filter((b) => b.id !== boardId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete board');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading boards...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Boards</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          + Create New Board
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {boards.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No boards yet. Create your first board to get started!</p>
          <Button onClick={() => setIsModalOpen(true)}>
            Create Your First Board
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {boards.map((board) => (
            <Card key={board.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <div
                className="h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-t-lg mb-4"
                onClick={() => router.push(`/boards/${board.id}`)}
              />
              <div
                className="px-4 pb-4"
                onClick={() => router.push(`/boards/${board.id}`)}
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{board.title}</h3>
                {board.description && (
                  <p className="text-gray-600 text-sm line-clamp-2">{board.description}</p>
                )}
              </div>
              <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteBoard(board.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Board</h2>
            <form onSubmit={handleCreateBoard}>
              <Input
                label="Board Title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter board title"
                required
              />
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter board description"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormData({ title: '', description: '' });
                    setError(null);
                  }}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Board'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
