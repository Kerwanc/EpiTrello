import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from './entities/card.entity';
import { List } from '../lists/entities/list.entity';
import { User } from '../users/entities/user.entity';
import { BoardMember } from '../boards/entities/board-member.entity';
import { CardsService } from './services/cards.service';
import { CardsController } from './controllers/cards.controller';
import { BoardsModule } from '../boards/boards.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Card, List, User, BoardMember]),
    BoardsModule,
  ],
  controllers: [CardsController],
  providers: [CardsService],
  exports: [CardsService],
})
export class CardsModule {}
