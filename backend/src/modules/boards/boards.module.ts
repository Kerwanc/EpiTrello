import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Board } from './entities/board.entity';
import { BoardMember } from './entities/board-member.entity';
import { List } from '../lists/entities/list.entity';
import { Card } from '../cards/entities/card.entity';
import { BoardsService } from './services/boards.service';
import { BoardPermissionService } from './services/board-permission.service';
import { BoardsController } from './controllers/boards.controller';
import { BoardPermissionGuard } from './guards/board-permission.guard';
import { ResourcePermissionGuard } from './guards/resource-permission.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Board, BoardMember, List, Card]),
    UsersModule,
  ],
  controllers: [BoardsController],
  providers: [
    BoardsService,
    BoardPermissionService,
    BoardPermissionGuard,
    ResourcePermissionGuard,
  ],
  exports: [
    BoardsService,
    BoardPermissionService,
    BoardPermissionGuard,
    ResourcePermissionGuard,
  ],
})
export class BoardsModule {}
