import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from './entities/card.entity';
import { Comment } from './entities/comment.entity';
import { List } from '../lists/entities/list.entity';
import { User } from '../users/entities/user.entity';
import { BoardMember } from '../boards/entities/board-member.entity';
import { CardsService } from './services/cards.service';
import { CommentsService } from './services/comments.service';
import { CardsController } from './controllers/cards.controller';
import { CommentsController } from './controllers/comments.controller';
import { BoardsModule } from '../boards/boards.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Card, Comment, List, User, BoardMember]),
    BoardsModule,
  ],
  controllers: [CardsController, CommentsController],
  providers: [CardsService, CommentsService],
  exports: [CardsService, CommentsService],
})
export class CardsModule {}
