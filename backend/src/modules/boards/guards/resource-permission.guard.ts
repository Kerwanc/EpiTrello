import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BoardPermissionService,
  BoardPermission,
} from '../services/board-permission.service';
import { BOARD_PERMISSION_KEY } from '../decorators/require-board-permission.decorator';
import { List } from '../../lists/entities/list.entity';
import { Card } from '../../cards/entities/card.entity';

@Injectable()
export class ResourcePermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private boardPermissionService: BoardPermissionService,
    @InjectRepository(List)
    private listRepository: Repository<List>,
    @InjectRepository(Card)
    private cardRepository: Repository<Card>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission =
      this.reflector.getAllAndOverride<BoardPermission>(BOARD_PERMISSION_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: { id: string };
      params: Record<string, string>;
      route?: { path?: string };
    }>();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    const boardId = await this.extractBoardId(request);

    if (!boardId) {
      throw new NotFoundException('Resource not found');
    }

    const hasPermission = await this.boardPermissionService.checkPermission(
      user.id,
      boardId,
      requiredPermission,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `You do not have permission to perform this action`,
      );
    }

    return true;
  }

  private async extractBoardId(request: {
    params: Record<string, string>;
    route?: { path?: string };
  }): Promise<string | null> {
    const params = request.params;
    const routePath = request.route?.path;
    const path = typeof routePath === 'string' ? routePath : '';

    if (params.boardId) {
      return params.boardId;
    }

    if (params.id && path.startsWith('/boards/:id')) {
      return params.id;
    }

    if (params.listId || (params.id && path.includes('/lists/'))) {
      const listId = params.listId || params.id;
      const list = await this.listRepository.findOne({
        where: { id: listId },
      });
      return list?.boardId || null;
    }

    if (params.cardId || (params.id && path.includes('/cards/'))) {
      const cardId = params.cardId || params.id;
      const card = await this.cardRepository.findOne({
        where: { id: cardId },
        relations: ['list'],
      });
      return card?.list?.boardId || null;
    }

    return null;
  }
}
