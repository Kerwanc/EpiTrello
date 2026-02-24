'use client';

import { useState } from 'react';
import { BoardMember, BoardRole } from '@/types';
import { apiClient } from '@/lib/api-client';
import { Button } from './Button';
import { Input } from './Input';

interface InviteMemberModalProps {
  boardId: string;
  onClose: () => void;
  onSuccess: (member: BoardMember) => void;
}

export default function InviteMemberModal({
  boardId,
  onClose,
  onSuccess,
}: InviteMemberModalProps) {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<BoardRole>(BoardRole.VISITOR);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const newMember = await apiClient.inviteBoardMember(boardId, {
        username: username.trim(),
        role,
      });
      onSuccess(newMember);
    } catch (err: any) {
      setError(err.message || 'Failed to invite member');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Invite Member</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="username"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Username
            </label>
            <Input
              type="text"
              id="username"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="role"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as BoardRole)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value={BoardRole.MODERATOR}>
                Moderator - Can edit board and cards
              </option>
              <option value={BoardRole.VISITOR}>
                Visitor - Read-only access
              </option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'Inviting...' : 'Send Invite'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
