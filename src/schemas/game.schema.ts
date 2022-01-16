import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { LetterState } from 'src/words.service';

export enum GameStatus {
  Started = 'started',
  Pending = 'pending',
  Finished = 'finished',
}

export class GamePlayer {
  @Prop()
  name: string;

  @Prop([String])
  rows: string[];

  @Prop([LetterState])
  statuses: LetterState[][];
}

export type GameDocument = Game & Document;

@Schema()
export class Game {
  @Prop()
  player1: GamePlayer;

  @Prop()
  player2: GamePlayer;

  @Prop()
  wordle: string;

  @Prop({ enum: GameStatus })
  status: GameStatus;

  @Prop()
  winner: string;
}

export const GameSchema = SchemaFactory.createForClass(Game);
