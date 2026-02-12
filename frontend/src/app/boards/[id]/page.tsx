'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
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

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (type === 'list') {
      const newLists = Array.from(lists);
      const [movedList] = newLists.splice(source.index, 1);
      newLists.splice(destination.index, 0, movedList);
      
      const updatedLists = newLists.map((list, index) => ({
        ...list,
        position: index,
      }));
      
      setLists(updatedLists);
      
      try {
        await Promise.all(
          updatedLists.map((list) =>
            apiClient.updateListPosition(list.id, boardId, list.position)
          )
        );
      } catch (err: any) {
        setError(err.message || 'Failed to update list positions');
        fetchBoardData();
      }
      return;
    }

    if (type === 'card') {
      const sourceListId = source.droppableId;
      const destListId = destination.droppableId;
      
      const sourceList = lists.find((l) => l.id === sourceListId);
      const destList = lists.find((l) => l.id === destListId);
      
      if (!sourceList || !destList) return;

      const movedCard = sourceList.cards.find((c) => c.id === draggableId);
      if (!movedCard) return;

      const newLists = [...lists];
      
      if (sourceListId === destListId) {
        const listIndex = newLists.findIndex((l) => l.id === sourceListId);
        const newCards = Array.from(sourceList.cards);
        newCards.splice(source.index, 1);
        newCards.splice(destination.index, 0, movedCard);
        
        const updatedCards = newCards.map((card, index) => ({
          ...card,
          position: index,
        }));
        
        newLists[listIndex] = { ...sourceList, cards: updatedCards };
        
        setLists(newLists);
        
        try {
          await Promise.all(
            updatedCards.map((card) =>
              apiClient.updateCardPosition(card.id, sourceListId, card.position)
            )
          );
        } catch (err: any) {
          setError(err.message || 'Failed to update card positions');
          fetchBoardData();
        }
      } else {
        const sourceListIndex = newLists.findIndex((l) => l.id === sourceListId);
        const destListIndex = newLists.findIndex((l) => l.id === destListId);
        
        const newSourceCards = Array.from(sourceList.cards);
        newSourceCards.splice(source.index, 1);
        
        const newDestCards = Array.from(destList.cards);
        newDestCards.splice(destination.index, 0, { ...movedCard, listId: destListId });
        
        const updatedSourceCards = newSourceCards.map((card, index) => ({
          ...card,
          position: index,
        }));
        
        const updatedDestCards = newDestCards.map((card, index) => ({
          ...card,
          position: index,
        }));
        
        newLists[sourceListIndex] = { ...sourceList, cards: updatedSourceCards };
        newLists[destListIndex] = { ...destList, cards: updatedDestCards };
        
        setLists(newLists);
        
        try {
          await apiClient.moveCard(movedCard.id, sourceListId, destListId, destination.index);
          
          const updatePromises = [
            ...updatedSourceCards.map((card) =>
              apiClient.updateCardPosition(card.id, sourceListId, card.position)
            ),
            ...updatedDestCards
              .filter((card) => card.id !== movedCard.id)
              .map((card) =>
                apiClient.updateCardPosition(card.id, destListId, card.position)
              ),
          ];
          
          await Promise.all(updatePromises);
        } catch (err: any) {
          setError(err.message || 'Failed to move card');
          fetchBoardData();
        }
      }
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
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="all-lists" direction="horizontal" type="list">
            {(provided) => (
              <div 
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex gap-4 min-h-[calc(100vh-200px)]"
              >
                {lists.map((list, index) => (
                  <Draggable key={list.id} draggableId={list.id} index={index}>
                    {(listDraggableProvided, listDraggableSnapshot) => (
                      <div
                        ref={listDraggableProvided.innerRef}
                        {...listDraggableProvided.draggableProps}
                        className={`w-80 flex-shrink-0 transition-all duration-200 ${
                          listDraggableSnapshot.isDragging 
                            ? 'opacity-80 scale-105 rotate-3' 
                            : ''
                        }`}
                      >
                        <Droppable droppableId={list.id} type="card">
                          {(cardDroppableProvided, cardDroppableSnapshot) => (
                            <div
                              ref={cardDroppableProvided.innerRef}
                              {...cardDroppableProvided.droppableProps}
                              className={`bg-gray-100 rounded-lg p-4 flex flex-col max-h-[calc(100vh-200px)] transition-all duration-200 ${
                                cardDroppableSnapshot.isDraggingOver 
                                  ? 'bg-blue-50 ring-2 ring-blue-400 ring-opacity-50 shadow-lg' 
                                  : 'shadow-md'
                              }`}
                            >
                              <div 
                                {...listDraggableProvided.dragHandleProps}
                                className="flex items-center justify-between mb-4 cursor-grab active:cursor-grabbing select-none hover:bg-gray-200 hover:bg-opacity-50 rounded px-2 py-1 -mx-2 -my-1 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400 text-sm">⋮⋮</span>
                                  <h2 className="text-lg font-semibold text-gray-900">{list.title}</h2>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteList(list.id)}
                                >
                                  Delete
                                </Button>
                              </div>

                              <div className={`flex-1 overflow-y-auto space-y-2 mb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent ${
                                list.cards.length === 0 ? 'min-h-[100px] flex items-center justify-center' : ''
                              }`}>
                                {list.cards.length === 0 && !cardDroppableSnapshot.isDraggingOver && (
                                  <p className="text-gray-400 text-sm text-center italic">Drop cards here</p>
                                )}
                                {list.cards.map((card, index) => (
                                  <Draggable key={card.id} draggableId={card.id} index={index}>
                                    {(cardDraggableProvided, cardDraggableSnapshot) => (
                                      <div
                                        ref={cardDraggableProvided.innerRef}
                                        {...cardDraggableProvided.draggableProps}
                                        {...cardDraggableProvided.dragHandleProps}
                                        className={`bg-white rounded-lg p-3 transition-all duration-150 cursor-grab active:cursor-grabbing ${
                                          cardDraggableSnapshot.isDragging 
                                            ? 'shadow-2xl ring-2 ring-blue-400 ring-opacity-50 rotate-2 scale-105 opacity-90' 
                                            : 'shadow-sm hover:shadow-lg hover:ring-1 hover:ring-gray-200'
                                        }`}
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <h3 className="font-medium text-gray-900 flex-1 break-words">{card.title}</h3>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteCard(list.id, card.id);
                                            }}
                                            className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded p-1 transition-colors flex-shrink-0"
                                            title="Delete card"
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
                                    )}
                                  </Draggable>
                                ))}
                                {cardDroppableProvided.placeholder}
                              </div>

                              {creatingCardInList === list.id ? (
                                <div className="bg-white rounded-lg p-3 shadow-sm border-2 border-blue-300">
                                  <input
                                    type="text"
                                    placeholder="Card title"
                                    value={newCardData.title}
                                    onChange={(e) =>
                                      setNewCardData({ ...newCardData, title: e.target.value })
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleCreateCard(list.id);
                                      } else if (e.key === 'Escape') {
                                        setCreatingCardInList(null);
                                        setNewCardData({ title: '', description: '' });
                                      }
                                    }}
                                    className="w-full px-2 py-1 bg-white border border-gray-300 rounded mb-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    autoFocus
                                  />
                                  <textarea
                                    placeholder="Description (optional)"
                                    value={newCardData.description}
                                    onChange={(e) =>
                                      setNewCardData({ ...newCardData, description: e.target.value })
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && e.ctrlKey) {
                                        e.preventDefault();
                                        handleCreateCard(list.id);
                                      } else if (e.key === 'Escape') {
                                        setCreatingCardInList(null);
                                        setNewCardData({ title: '', description: '' });
                                      }
                                    }}
                                    className="w-full px-2 py-1 bg-white border border-gray-300 rounded mb-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
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
                                  <p className="text-xs text-gray-500 mt-2">
                                    Press Enter to add • Ctrl+Enter in description • Esc to cancel
                                  </p>
                                </div>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setCreatingCardInList(list.id)}
                                  className="w-full hover:bg-gray-200 transition-colors"
                                >
                                  + Add a card
                                </Button>
                              )}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}

                {isCreatingList ? (
                  <div className="bg-gray-100 rounded-lg p-4 w-80 flex-shrink-0 shadow-md h-fit">
                    <Input
                      type="text"
                      placeholder="Enter list title..."
                      value={newListTitle}
                      onChange={(e) => setNewListTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateList();
                        } else if (e.key === 'Escape') {
                          setIsCreatingList(false);
                          setNewListTitle('');
                        }
                      }}
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
                    className="bg-white/30 hover:bg-white/40 rounded-lg p-4 w-80 h-[200px] flex-shrink-0 flex items-center justify-center text-white font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 backdrop-blur-sm"
                  >
                    + Add another list
                  </button>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}
