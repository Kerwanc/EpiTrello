import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import {
  Notification,
  NotificationType,
} from '../entities/notification.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockNotificationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const userId = 'user-123';
  const otherUserId = 'other-user-456';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      const type = NotificationType.BOARD_INVITATION;
      const message = 'John invited you to Project Board';
      const relatedBoardId = 'board-123';

      const mockNotification = {
        id: 'notif-1',
        userId,
        type,
        message,
        relatedBoardId,
        relatedCardId: null,
        isRead: false,
        createdAt: new Date(),
      };

      mockNotificationRepository.create.mockReturnValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue(mockNotification);

      const result = await service.createNotification(
        userId,
        type,
        message,
        relatedBoardId,
      );

      expect(mockNotificationRepository.create).toHaveBeenCalledWith({
        userId,
        type,
        message,
        relatedBoardId,
        relatedCardId: null,
        isRead: false,
      });
      expect(result.id).toBe('notif-1');
      expect(result.message).toBe(message);
      expect(result.isRead).toBe(false);
    });

    it('should create a notification without related entities', async () => {
      const type = NotificationType.CARD_ASSIGNMENT;
      const message = 'You were assigned to a card';

      const mockNotification = {
        id: 'notif-2',
        userId,
        type,
        message,
        relatedBoardId: null,
        relatedCardId: null,
        isRead: false,
        createdAt: new Date(),
      };

      mockNotificationRepository.create.mockReturnValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue(mockNotification);

      const result = await service.createNotification(userId, type, message);

      expect(mockNotificationRepository.create).toHaveBeenCalledWith({
        userId,
        type,
        message,
        relatedBoardId: null,
        relatedCardId: null,
        isRead: false,
      });
      expect(result.relatedBoardId).toBeNull();
      expect(result.relatedCardId).toBeNull();
    });
  });

  describe('getUserNotifications', () => {
    it('should return paginated notifications for a user', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          userId,
          type: NotificationType.BOARD_INVITATION,
          message: 'Message 1',
          relatedBoardId: 'board-1',
          relatedCardId: null,
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: 'notif-2',
          userId,
          type: NotificationType.CARD_ASSIGNMENT,
          message: 'Message 2',
          relatedBoardId: null,
          relatedCardId: 'card-1',
          isRead: true,
          createdAt: new Date(),
        },
      ];

      mockNotificationRepository.findAndCount.mockResolvedValue([
        mockNotifications,
        2,
      ]);

      const result = await service.getUserNotifications(userId, 1, 20);

      expect(mockNotificationRepository.findAndCount).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });
      expect(result.notifications).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.notifications[0].id).toBe('notif-1');
    });

    it('should handle pagination correctly', async () => {
      const page = 2;
      const limit = 10;

      mockNotificationRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.getUserNotifications(userId, page, limit);

      expect(mockNotificationRepository.findAndCount).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
        skip: 10,
        take: 10,
      });
    });

    it('should use default pagination values', async () => {
      mockNotificationRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.getUserNotifications(userId);

      expect(mockNotificationRepository.findAndCount).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return the count of unread notifications', async () => {
      mockNotificationRepository.count.mockResolvedValue(5);

      const result = await service.getUnreadCount(userId);

      expect(mockNotificationRepository.count).toHaveBeenCalledWith({
        where: { userId, isRead: false },
      });
      expect(result).toBe(5);
    });

    it('should return 0 when no unread notifications', async () => {
      mockNotificationRepository.count.mockResolvedValue(0);

      const result = await service.getUnreadCount(userId);

      expect(result).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const notificationId = 'notif-1';
      const mockNotification = {
        id: notificationId,
        userId,
        type: NotificationType.BOARD_INVITATION,
        message: 'Test message',
        relatedBoardId: null,
        relatedCardId: null,
        isRead: false,
        createdAt: new Date(),
      };

      const updatedNotification = { ...mockNotification, isRead: true };

      mockNotificationRepository.findOne.mockResolvedValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue(updatedNotification);

      const result = await service.markAsRead(notificationId, userId);

      expect(mockNotificationRepository.findOne).toHaveBeenCalledWith({
        where: { id: notificationId },
      });
      expect(result.isRead).toBe(true);
    });

    it('should throw NotFoundException if notification does not exist', async () => {
      const notificationId = 'nonexistent';

      mockNotificationRepository.findOne.mockResolvedValue(null);

      await expect(service.markAsRead(notificationId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user does not own the notification', async () => {
      const notificationId = 'notif-1';
      const mockNotification = {
        id: notificationId,
        userId: otherUserId,
        type: NotificationType.BOARD_INVITATION,
        message: 'Test message',
        relatedBoardId: null,
        relatedCardId: null,
        isRead: false,
        createdAt: new Date(),
      };

      mockNotificationRepository.findOne.mockResolvedValue(mockNotification);

      await expect(service.markAsRead(notificationId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read for a user', async () => {
      mockNotificationRepository.update.mockResolvedValue({ affected: 3 });

      await service.markAllAsRead(userId);

      expect(mockNotificationRepository.update).toHaveBeenCalledWith(
        { userId, isRead: false },
        { isRead: true },
      );
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification successfully', async () => {
      const notificationId = 'notif-1';
      const mockNotification = {
        id: notificationId,
        userId,
        type: NotificationType.BOARD_INVITATION,
        message: 'Test message',
        relatedBoardId: null,
        relatedCardId: null,
        isRead: false,
        createdAt: new Date(),
      };

      mockNotificationRepository.findOne.mockResolvedValue(mockNotification);
      mockNotificationRepository.remove.mockResolvedValue(mockNotification);

      await service.deleteNotification(notificationId, userId);

      expect(mockNotificationRepository.findOne).toHaveBeenCalledWith({
        where: { id: notificationId },
      });
      expect(mockNotificationRepository.remove).toHaveBeenCalledWith(
        mockNotification,
      );
    });

    it('should throw NotFoundException if notification does not exist', async () => {
      const notificationId = 'nonexistent';

      mockNotificationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deleteNotification(notificationId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own the notification', async () => {
      const notificationId = 'notif-1';
      const mockNotification = {
        id: notificationId,
        userId: otherUserId,
        type: NotificationType.BOARD_INVITATION,
        message: 'Test message',
        relatedBoardId: null,
        relatedCardId: null,
        isRead: false,
        createdAt: new Date(),
      };

      mockNotificationRepository.findOne.mockResolvedValue(mockNotification);

      await expect(
        service.deleteNotification(notificationId, userId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
