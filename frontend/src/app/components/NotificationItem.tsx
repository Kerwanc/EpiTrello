'use client';

import { useRouter } from 'next/navigation';
import { Notification, NotificationType } from '@/types';
import { useNotifications } from './NotificationProvider';

interface NotificationItemProps {
  notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const router = useRouter();
  const { markAsRead, deleteNotification } = useNotifications();

  const handleClick = async () => {
    if (!notification.isRead) {
      try {
        await markAsRead(notification.id);
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }

    if (notification.relatedBoardId) {
      router.push(`/boards/${notification.relatedBoardId}`);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification(notification.id);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case NotificationType.BOARD_INVITATION:
        return (
          <svg
            className="h-5 w-5 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        );
      case NotificationType.CARD_ASSIGNMENT:
        return (
          <svg
            className="h-5 w-5 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
      case NotificationType.ROLE_CHANGE:
        return (
          <svg
            className="h-5 w-5 text-purple-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
        !notification.isRead ? 'bg-blue-50' : ''
      }`}
    >
      <div className="flex-shrink-0 mt-1">{getIcon()}</div>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm ${notification.isRead ? 'text-gray-700' : 'text-gray-900 font-medium'}`}
        >
          {notification.message}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {formatTimeAgo(notification.createdAt)}
        </p>
      </div>

      <button
        onClick={handleDelete}
        className="flex-shrink-0 p-1 rounded hover:bg-gray-200 transition-colors"
        aria-label="Delete notification"
      >
        <svg
          className="h-4 w-4 text-gray-400 hover:text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {!notification.isRead && (
        <div className="flex-shrink-0 mt-2">
          <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
        </div>
      )}
    </div>
  );
}
