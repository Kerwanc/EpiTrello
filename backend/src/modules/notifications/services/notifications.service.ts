import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
} from '../entities/notification.entity';
import { NotificationResponseDto } from '../dtos/notification-response.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async createNotification(
    userId: string,
    type: NotificationType,
    message: string,
    relatedBoardId?: string,
    relatedCardId?: string,
  ): Promise<NotificationResponseDto> {
    const notification = this.notificationRepository.create({
      userId,
      type,
      message,
      relatedBoardId: relatedBoardId || null,
      relatedCardId: relatedCardId || null,
      isRead: false,
    });

    const savedNotification =
      await this.notificationRepository.save(notification);
    return this.mapToNotificationResponseDto(savedNotification);
  }

  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ notifications: NotificationResponseDto[]; total: number }> {
    const skip = (page - 1) * limit;

    const [notifications, total] =
      await this.notificationRepository.findAndCount({
        where: { userId },
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      });

    return {
      notifications: notifications.map((n) =>
        this.mapToNotificationResponseDto(n),
      ),
      total,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(
        `Notification with ID ${notificationId} not found`,
      );
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You can only modify your own notifications',
      );
    }

    notification.isRead = true;
    const updatedNotification =
      await this.notificationRepository.save(notification);
    return this.mapToNotificationResponseDto(updatedNotification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(
        `Notification with ID ${notificationId} not found`,
      );
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own notifications',
      );
    }

    await this.notificationRepository.remove(notification);
  }

  private mapToNotificationResponseDto(
    notification: Notification,
  ): NotificationResponseDto {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      message: notification.message,
      relatedBoardId: notification.relatedBoardId,
      relatedCardId: notification.relatedCardId,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    };
  }
}
