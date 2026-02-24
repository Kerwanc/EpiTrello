import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Board } from './entities/board.entity';
import { BoardMember } from './entities/board-member.entity';
import { BoardsService } from './services/boards.service';
import { BoardsController } from './controllers/boards.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Board, BoardMember])],
  controllers: [BoardsController],
  providers: [BoardsService],
  exports: [BoardsService],
})
export class BoardsModule {}
