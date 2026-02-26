import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from '../services/notifications.service';
import { JwtGuard } from '../../../common/guards/jwt.guard';
import { NotificationResponseDto } from '../dtos/notification-response.dto';

@Controller('notifications')
@UseGuards(JwtGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async getUserNotifications(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Request() req,
  ): Promise<{ notifications: NotificationResponseDto[]; total: number }> {
    const userId = req.user.id;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    return this.notificationsService.getUserNotifications(
      userId,
      pageNum,
      limitNum,
    );
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req): Promise<{ count: number }> {
    const userId = req.user.id;
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id') notificationId: string,
    @Request() req,
  ): Promise<NotificationResponseDto> {
    const userId = req.user.id;
    return this.notificationsService.markAsRead(notificationId, userId);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllAsRead(@Request() req): Promise<void> {
    const userId = req.user.id;
    await this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNotification(
    @Param('id') notificationId: string,
    @Request() req,
  ): Promise<void> {
    const userId = req.user.id;
    await this.notificationsService.deleteNotification(notificationId, userId);
  }
}
