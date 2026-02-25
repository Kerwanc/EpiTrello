import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  BoardPermissionService,
  BoardPermission,
} from '../services/board-permission.service';
import { BOARD_PERMISSION_KEY } from '../decorators/require-board-permission.decorator';

@Injectable()
export class BoardPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private boardPermissionService: BoardPermissionService,
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
      boardId?: string;
    }>();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    const boardId = this.extractBoardId(request);

    if (!boardId) {
      throw new ForbiddenException('Board ID not found in request');
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

  private extractBoardId(request: {
    params: Record<string, string>;
    route?: { path?: string };
    boardId?: string;
  }): string | null {
    if (request.params.boardId) {
      return request.params.boardId;
    }

    const routePath = request.route?.path;
    if (
      request.params.id &&
      typeof routePath === 'string' &&
      routePath.startsWith('/boards/:id')
    ) {
      return request.params.id;
    }

    if (request.boardId) {
      return request.boardId;
    }

    return request.params.id || null;
  }
}
