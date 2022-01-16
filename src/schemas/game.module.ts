import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from 'src/app.controller';
import { GameService } from 'src/game.service';
import { PlayController } from 'src/play.controller';
import { WordsService } from 'src/words.service';
import { Game, GameSchema } from './game.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Game.name, schema: GameSchema }]),
  ],
  controllers: [AppController, PlayController],
  providers: [GameService, WordsService],
})
export class GameModule {}
