import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateGameData, GameData } from './dtos/game';
import { GameService } from './game.service';

@Controller('games')
export class AppController {
  constructor(private readonly gameService: GameService) {}

  @Post('join')
  async joinGame(@Body() details: CreateGameData): Promise<GameData> {
    const gameDetails = await this.gameService.joinGame(details.userId);
    const opponentId =
      gameDetails.player1.name === details.userId
        ? gameDetails.player2.name
        : gameDetails.player1.name;
    return {
      opponentId,
      gameId: gameDetails.id,
    };
  }

  @Post('create')
  async createGame(@Body() details: CreateGameData) {
    const gameDetails = await this.gameService.createGame(details.userId, true);
    return {
      gameId: gameDetails.id,
    };
  }

  @Get('game/:gameId/status/:playerId')
  getOppositePlayerStatus(@Param() params) {
    const { gameId, playerId } = params;
    return this.gameService.getPlayerStatus(gameId, playerId);
  }
}
