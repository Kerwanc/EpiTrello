'use client';

import { useState, useEffect } from 'react';
import { BoardMember, BoardRole } from '@/types';
import { apiClient } from '@/lib/api-client';
import { Button } from './Button';
import { useAuth } from './AuthProvider';
import InviteMemberModal from './InviteMemberModal';

interface BoardMembersModalProps {
  boardId: string;
  isOwner: boolean;
  onClose: () => void;
}

export default function BoardMembersModal({
  boardId,
  isOwner,
  onClose,
}: BoardMembersModalProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, [boardId]);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getBoardMembers(boardId);
      setMembers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: BoardRole) => {
    try {
      setUpdatingMemberId(memberId);
      setError(null);
      const updatedMember = await apiClient.updateMemberRole(boardId, memberId, {
        role: newRole,
      });
      setMembers(
        members.map((m) => (m.id === memberId ? updatedMember : m)),
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update member role');
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (
      !confirm('Are you sure you want to remove this member from the board?')
    ) {
      return;
    }

    try {
      setError(null);
      await apiClient.removeBoardMember(boardId, memberId);
      setMembers(members.filter((m) => m.id !== memberId));
    } catch (err: any) {
      setError(err.message || 'Failed to remove member');
    }
  };

  const handleInviteSuccess = (newMember: BoardMember) => {
    setMembers([...members, newMember]);
    setIsInviteModalOpen(false);
  };

  const getRoleBadgeColor = (role: BoardRole) => {
    switch (role) {
      case BoardRole.OWNER:
        return 'bg-purple-100 text-purple-700';
      case BoardRole.MODERATOR:
        return 'bg-blue-100 text-blue-700';
      case BoardRole.VISITOR:
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Board Members</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-200px)]">
            {isLoading ? (
              <p className="text-center text-gray-600 py-8">
                Loading members...
              </p>
            ) : members.length === 0 ? (
              <p className="text-center text-gray-600 py-8">
                No members found
              </p>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                        {member.user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {member.user.username}
                          {member.userId === user?.id && (
                            <span className="ml-2 text-xs text-gray-500">
                              (You)
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600">
                          {member.user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isOwner && member.role !== BoardRole.OWNER ? (
                        <>
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleRoleChange(
                                member.id,
                                e.target.value as BoardRole,
                              )
                            }
                            disabled={updatingMemberId === member.id}
                            className="px-3 py-1 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            <option value={BoardRole.MODERATOR}>
                              Moderator
                            </option>
                            <option value={BoardRole.VISITOR}>Visitor</option>
                          </select>
                          {member.userId !== user?.id && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              Remove
                            </Button>
                          )}
                        </>
                      ) : (
                        <span
                          className={`px-3 py-1 text-sm font-semibold rounded-lg ${getRoleBadgeColor(member.role)}`}
                        >
                          {member.role.charAt(0).toUpperCase() +
                            member.role.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            {isOwner ? (
              <Button
                variant="primary"
                onClick={() => setIsInviteModalOpen(true)}
              >
                Invite Member
              </Button>
            ) : (
              <div></div>
            )}
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>

      {isInviteModalOpen && (
        <InviteMemberModal
          boardId={boardId}
          onClose={() => setIsInviteModalOpen(false)}
          onSuccess={handleInviteSuccess}
        />
      )}
    </>
  );
}
