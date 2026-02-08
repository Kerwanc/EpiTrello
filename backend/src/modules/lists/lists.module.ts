import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { List } from './entities/list.entity';
import { Board } from '../boards/entities/board.entity';
import { ListsService } from './services/lists.service';
import { ListsController } from './controllers/lists.controller';

@Module({
  imports: [TypeOrmModule.forFeature([List, Board])],
  controllers: [ListsController],
  providers: [ListsService],
  exports: [ListsService],
})
export class ListsModule {}
