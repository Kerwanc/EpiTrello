'use client';

import { useState, useEffect } from 'react';
import { Card, User, BoardMember, BoardRole, Comment } from '@/types';
import { apiClient } from '@/lib/api-client';
import { Button } from './Button';
import { Input } from './Input';
import { useAuth } from './AuthProvider';

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
  const { user: currentUser } = useAuth();
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [dueDate, setDueDate] = useState(
    card.dueDate ? card.dueDate.split('T')[0] : '',
  );
  const [tagsInput, setTagsInput] = useState(
    card.tags ? card.tags.join(', ') : '',
  );

  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [assignedUsers, setAssignedUsers] = useState<User[]>(
    card.assignedUsers || [],
  );
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null,
  );

  const canManageAssignments =
    userRole === BoardRole.OWNER || userRole === BoardRole.MODERATOR;
  const canAddComments = canManageAssignments;
  const canDeleteAnyComment = canManageAssignments;

  useEffect(() => {
    if (canManageAssignments) {
      fetchBoardMembers();
    }
    fetchComments();
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

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      setCommentError(null);
      const fetchedComments = await apiClient.getCardComments(
        card.listId,
        card.id,
      );
      setComments(fetchedComments);
    } catch (err: any) {
      setCommentError(err.message || 'Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentContent.trim()) return;

    try {
      setCommentError(null);
      await apiClient.createComment(card.listId, card.id, {
        content: newCommentContent.trim(),
      });
      setNewCommentContent('');
      await fetchComments();
    } catch (err: any) {
      setCommentError(err.message || 'Failed to add comment');
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editingCommentContent.trim()) return;

    try {
      setCommentError(null);
      await apiClient.updateComment(card.listId, card.id, commentId, {
        content: editingCommentContent.trim(),
      });
      setEditingCommentId(null);
      setEditingCommentContent('');
      await fetchComments();
    } catch (err: any) {
      setCommentError(err.message || 'Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      setCommentError(null);
      setDeletingCommentId(commentId);
      await apiClient.deleteComment(card.listId, card.id, commentId);
      await fetchComments();
    } catch (err: any) {
      setCommentError(err.message || 'Failed to delete comment');
    } finally {
      setDeletingCommentId(null);
    }
  };

  const startEditingComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentContent(comment.content);
  };

  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditingCommentContent('');
  };

  const canEditComment = (comment: Comment) => {
    return currentUser?.id === comment.authorId;
  };

  const canDeleteComment = (comment: Comment) => {
    return currentUser?.id === comment.authorId || canDeleteAnyComment;
  };

  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleAssignUser = async (userId: string) => {
    try {
      setAssignmentError(null);
      const updatedCard = await apiClient.assignUserToCard(
        card.listId,
        card.id,
        userId,
      );
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

  const MAX_COMMENT_LENGTH = 1000;
  const remainingChars = MAX_COMMENT_LENGTH - newCommentContent.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-[#F5F5DC] rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Edit Card</h2>

          <div className="flex gap-6">
            <div className="flex-1">
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
                      <p className="text-sm text-gray-600">
                        Loading members...
                      </p>
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

            <div className="flex-1 border-l border-gray-300 pl-6">
              <h3 className="text-lg font-bold mb-4 text-gray-900">Comments</h3>

              {commentError && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                  {commentError}
                </div>
              )}

              {canAddComments && (
                <form onSubmit={handleAddComment} className="mb-6">
                  <textarea
                    value={newCommentContent}
                    onChange={(e) => setNewCommentContent(e.target.value)}
                    placeholder="Write a comment..."
                    rows={3}
                    maxLength={MAX_COMMENT_LENGTH}
                    className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span
                      className={`text-xs ${
                        remainingChars < 100 ? 'text-red-600' : 'text-gray-500'
                      }`}
                    >
                      {remainingChars} characters remaining
                    </span>
                    <Button
                      type="submit"
                      disabled={!newCommentContent.trim()}
                      className="text-sm py-1 px-3"
                    >
                      Add Comment
                    </Button>
                  </div>
                </form>
              )}

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {loadingComments ? (
                  <p className="text-sm text-gray-600">Loading comments...</p>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    No comments yet.
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-white border border-gray-300 rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                            {comment.author.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-gray-900">
                              {comment.author.username}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-blue-600">
                                {formatCommentDate(comment.createdAt)}
                              </span>
                              {comment.isEdited && (
                                <span className="text-xs text-gray-500">
                                  (edited)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-1">
                          {canEditComment(comment) &&
                            editingCommentId !== comment.id && (
                              <button
                                type="button"
                                onClick={() => startEditingComment(comment)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                Edit
                              </button>
                            )}
                          {canDeleteComment(comment) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(comment.id)}
                              disabled={deletingCommentId === comment.id}
                              className="text-xs text-red-600 hover:text-red-800 ml-2"
                            >
                              {deletingCommentId === comment.id
                                ? 'Deleting...'
                                : 'Delete'}
                            </button>
                          )}
                        </div>
                      </div>

                      {editingCommentId === comment.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingCommentContent}
                            onChange={(e) =>
                              setEditingCommentContent(e.target.value)
                            }
                            rows={3}
                            maxLength={MAX_COMMENT_LENGTH}
                            className="w-full px-2 py-1 border border-gray-400 rounded text-sm text-gray-900 resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditComment(comment.id)}
                              disabled={!editingCommentContent.trim()}
                              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:bg-gray-400"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditingComment}
                              className="text-xs bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
