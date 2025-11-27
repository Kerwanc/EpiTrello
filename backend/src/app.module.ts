import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from './config/database.config';

@Module({
  imports: [
    TypeOrmModule.forRoot(AppDataSource.options)
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
