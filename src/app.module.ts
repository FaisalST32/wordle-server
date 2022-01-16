import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GameModule } from './schemas/game.module';

@Module({
  imports: [
    GameModule,
    MongooseModule.forRoot('mongodb://localhost:27017/wordle'),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
