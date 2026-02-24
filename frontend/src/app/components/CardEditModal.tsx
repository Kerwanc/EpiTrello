'use client';

import { useState, useEffect } from 'react';
import { Card, User, BoardMember, BoardRole } from '@/types';
import { apiClient } from '@/lib/api-client';
import { Button } from './Button';
import { Input } from './Input';

interface CardEditModalProps {
  card: Card;
  boardId: string;
  userRole?: BoardRole;
  onClose: () => void;
  onSave: (updatedCard: {
    title: string;
    description: string;
    dueDate: string | undefined;
    tags: string[] | undefined;
  }) => void;
  onAssignmentsChange?: () => void;
}

export default function CardEditModal({
  card,
  boardId,
  userRole,
  onClose,
  onSave,
  onAssignmentsChange,
}: CardEditModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [dueDate, setDueDate] = useState(
    card.dueDate ? card.dueDate.split('T')[0] : '',
  );
  const [tagsInput, setTagsInput] = useState(
    card.tags ? card.tags.join(', ') : '',
  );
  
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [assignedUsers, setAssignedUsers] = useState<User[]>(card.assignedUsers || []);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  const canManageAssignments = userRole === BoardRole.OWNER || userRole === BoardRole.MODERATOR;

  useEffect(() => {
    if (canManageAssignments) {
      fetchBoardMembers();
    }
  }, [boardId, canManageAssignments]);

  const fetchBoardMembers = async () => {
    try {
      setLoadingMembers(true);
      const members = await apiClient.getBoardMembers(boardId);
      setBoardMembers(members);
    } catch (err: any) {
      setAssignmentError(err.message || 'Failed to load board members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleAssignUser = async (userId: string) => {
    try {
      setAssignmentError(null);
      const updatedCard = await apiClient.assignUserToCard(card.listId, card.id, userId);
      setAssignedUsers(updatedCard.assignedUsers || []);
      if (onAssignmentsChange) {
        onAssignmentsChange();
      }
    } catch (err: any) {
      setAssignmentError(err.message || 'Failed to assign user');
    }
  };

  const handleUnassignUser = async (userId: string) => {
    try {
      setAssignmentError(null);
      await apiClient.unassignUserFromCard(card.listId, card.id, userId);
      setAssignedUsers(assignedUsers.filter((u) => u.id !== userId));
      if (onAssignmentsChange) {
        onAssignmentsChange();
      }
    } catch (err: any) {
      setAssignmentError(err.message || 'Failed to unassign user');
    }
  };

  const isUserAssigned = (userId: string) => {
    return assignedUsers.some((u) => u.id === userId);
  };

  const getAvailableUsers = () => {
    return boardMembers
      .filter((member) => !isUserAssigned(member.userId))
      .map((member) => ({
        user: member.user,
        role: member.role,
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const tags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    onSave({
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      tags: tags.length > 0 ? tags : undefined,
    });
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-[#F5F5DC] rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Edit Card</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-bold mb-2 text-gray-800"
              >
                Title *
              </label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTitle(e.target.value)
                }
                placeholder="Card title"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-bold mb-2 text-gray-800"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setDescription(e.target.value)
                }
                placeholder="Add a description..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>

            <div>
              <label
                htmlFor="dueDate"
                className="block text-sm font-bold mb-2 text-gray-800"
              >
                Due Date
              </label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDueDate(e.target.value)
                }
              />
            </div>

            <div>
              <label
                htmlFor="tags"
                className="block text-sm font-bold mb-2 text-gray-800"
              >
                Tags (comma-separated)
              </label>
              <Input
                id="tags"
                type="text"
                value={tagsInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTagsInput(e.target.value)
                }
                placeholder="bug, feature, urgent"
              />
              <p className="text-sm text-gray-700 mt-1">
                Separate tags with commas
              </p>
            </div>

            {canManageAssignments && (
              <div className="border-t border-gray-300 pt-4">
                <label className="block text-sm font-bold mb-2 text-gray-800">
                  Assigned Members
                </label>
                
                {assignmentError && (
                  <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                    {assignmentError}
                  </div>
                )}

                {loadingMembers ? (
                  <p className="text-sm text-gray-600">Loading members...</p>
                ) : (
                  <>
                    {assignedUsers.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {assignedUsers.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2"
                          >
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-gray-900">
                              {user.username}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUnassignUser(user.id)}
                              className="text-gray-500 hover:text-red-600 ml-1"
                              title="Unassign"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-sm text-gray-700 mb-2">
                        Available members:
                      </p>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {getAvailableUsers().map((item) => (
                          <button
                            key={item.user.id}
                            type="button"
                            onClick={() => handleAssignUser(item.user.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs font-semibold">
                              {item.user.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-gray-900">
                              {item.user.username}
                            </span>
                            <span className="text-xs text-gray-500 ml-auto">
                              {item.role}
                            </span>
                          </button>
                        ))}
                        {getAvailableUsers().length === 0 && (
                          <p className="text-sm text-gray-500 italic">
                            All members are assigned
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                className="bg-gray-500 hover:bg-gray-600"
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
