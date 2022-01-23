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
};
