import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from './entities/card.entity';
import { List } from '../lists/entities/list.entity';
import { CardsService } from './services/cards.service';
import { CardsController } from './controllers/cards.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Card, List])],
  controllers: [CardsController],
  providers: [CardsService],
  exports: [CardsService],
})
export class CardsModule {}
