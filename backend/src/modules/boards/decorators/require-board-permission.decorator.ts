import { SetMetadata } from '@nestjs/common';
import { BoardPermission } from '../services/board-permission.service';

export const BOARD_PERMISSION_KEY = 'board_permission';

export const RequireBoardPermission = (permission: BoardPermission) =>
  SetMetadata(BOARD_PERMISSION_KEY, permission);
