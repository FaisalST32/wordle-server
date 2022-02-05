import { GameStatus } from 'src/schemas/game.schema';

export type CreateGameData = {
  userId: string;
};
export type JoinGameFromCodeData = {
  userId: string;
  gameCode: string;
};

export type GameData = {
  opponentId: string;
  gameId: string;
  status?: GameStatus;
};

export type CheckGameData = {
  playerId: string;
  gameId: string;
};
