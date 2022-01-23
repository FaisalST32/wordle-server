import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { LetterState } from 'src/words.service';

export enum GameStatus {
  Started = 'started',
  Pending = 'pending',
  Finished = 'finished',
  Cancelled = 'cancelled',
}

export enum GameMode {
  Solo = 'solo',
  Online = 'online',
}

export type OngoingGame = {
  gameId: string;
  moves?: { character: string; state: LetterState }[][];
  opponentMoves?: LetterState[][];
  opponentId: string;
};

export class GamePlayer {
  @Prop()
  name: string;

  @Prop([String])
  rows: string[];

  @Prop([LetterState])
  statuses: LetterState[][];
}

export class GameConfig {
  @Prop({ enum: GameMode })
  mode: GameMode;
}

export type GameDocument = Game & Document;

@Schema({ timestamps: true })
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

  @Prop()
  config: GameConfig;

  @Prop({ required: false })
  gameCode?: string;
}

export const GameSchema = SchemaFactory.createForClass(Game);
