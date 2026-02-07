'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../components/AuthProvider';
import { apiClient } from '@/lib/api-client';
import { Board, List, Card } from '@/types';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

interface ListWithCards extends List {
  cards: Card[];
}

export default function BoardDetailPage() {
  const params = useParams();
  const boardId = params?.id as string;
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [board, setBoard] = useState<Board | null>(null);
  const [lists, setLists] = useState<ListWithCards[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  
  const [creatingCardInList, setCreatingCardInList] = useState<string | null>(null);
  const [newCardData, setNewCardData] = useState({ title: '', description: '' });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && boardId) {
      fetchBoardData();
    }
  }, [isAuthenticated, authLoading, boardId, router]);

  const fetchBoardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [boardData, listsData] = await Promise.all([
        apiClient.getBoard(boardId),
        apiClient.getLists(boardId),
      ]);
      
      setBoard(boardData);
      
      const listsWithCards = await Promise.all(
        listsData.map(async (list) => {
          const cards = await apiClient.getCards(list.id);
          return { ...list, cards: cards.sort((a, b) => a.position - b.position) };
        })
      );
      
      setLists(listsWithCards.sort((a, b) => a.position - b.position));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch board data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListTitle.trim()) return;

    try {
      setError(null);
      const newList = await apiClient.createList(boardId, {
        title: newListTitle,
        position: lists.length,
      });
      
      setLists([...lists, { ...newList, cards: [] }]);
      setNewListTitle('');
      setIsCreatingList(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create list');
    }
  };

  const handleCreateCard = async (listId: string) => {
    if (!newCardData.title.trim()) return;

    try {
      setError(null);
      const list = lists.find((l) => l.id === listId);
      if (!list) return;

      const newCard = await apiClient.createCard(listId, {
        title: newCardData.title,
        description: newCardData.description || undefined,
        position: list.cards.length,
      });

      setLists(
        lists.map((l) =>
          l.id === listId ? { ...l, cards: [...l.cards, newCard] } : l
        )
      );
      
      setNewCardData({ title: '', description: '' });
      setCreatingCardInList(null);
    } catch (err: any) {
      setError(err.message || 'Failed to create card');
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this list and all its cards?')) {
      return;
    }

    try {
      await apiClient.deleteList(listId, boardId);
      setLists(lists.filter((l) => l.id !== listId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete list');
    }
  };

  const handleDeleteCard = async (listId: string, cardId: string) => {
    if (!confirm('Are you sure you want to delete this card?')) {
      return;
    }

    try {
      await apiClient.deleteCard(cardId, listId);
      setLists(
        lists.map((l) =>
          l.id === listId
            ? { ...l, cards: l.cards.filter((c) => c.id !== cardId) }
            : l
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to delete card');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading board...</p>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Board not found</p>
          <Button onClick={() => router.push('/boards')}>Back to Boards</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-blue-600">
      <div className="bg-black/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{board.title}</h1>
            {board.description && (
              <p className="text-white/80 text-sm mt-1">{board.description}</p>
            )}
          </div>
          <Button variant="secondary" onClick={() => router.push('/boards')}>
            Back to Boards
          </Button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="p-6 overflow-x-auto">
        <div className="flex gap-4 min-h-[calc(100vh-200px)]">
          {lists.map((list) => (
            <div
              key={list.id}
              className="bg-gray-100 rounded-lg p-4 w-80 flex-shrink-0 flex flex-col max-h-[calc(100vh-200px)]"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{list.title}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteList(list.id)}
                >
                  Delete
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {list.cards.map((card) => (
                  <div
                    key={card.id}
                    className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium text-gray-900 flex-1">{card.title}</h3>
                      <button
                        onClick={() => handleDeleteCard(list.id, card.id)}
                        className="text-gray-400 hover:text-red-600 ml-2"
                      >
                        ×
                      </button>
                    </div>
                    {card.description && (
                      <p className="text-sm text-gray-600 mt-2">{card.description}</p>
                    )}
                    {card.dueDate && (
                      <p className="text-xs text-gray-500 mt-2">
                        Due: {new Date(card.dueDate).toLocaleDateString()}
                      </p>
                    )}
                    {card.tags && card.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {card.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {creatingCardInList === list.id ? (
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <input
                    type="text"
                    placeholder="Card title"
                    value={newCardData.title}
                    onChange={(e) =>
                      setNewCardData({ ...newCardData, title: e.target.value })
                    }
                    className="w-full px-2 py-1 bg-white border border-gray-300 rounded mb-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={newCardData.description}
                    onChange={(e) =>
                      setNewCardData({ ...newCardData, description: e.target.value })
                    }
                    className="w-full px-2 py-1 bg-white border border-gray-300 rounded mb-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleCreateCard(list.id)}
                    >
                      Add Card
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setCreatingCardInList(null);
                        setNewCardData({ title: '', description: '' });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCreatingCardInList(list.id)}
                >
                  + Add a card
                </Button>
              )}
            </div>
          ))}

          {isCreatingList ? (
            <div className="bg-gray-100 rounded-lg p-4 w-80 flex-shrink-0">
              <Input
                type="text"
                placeholder="Enter list title..."
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleCreateList}>
                  Add List
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsCreatingList(false);
                    setNewListTitle('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreatingList(true)}
              className="bg-white/30 hover:bg-white/40 rounded-lg p-4 w-80 flex-shrink-0 text-white font-medium transition-colors"
            >
              + Add another list
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
