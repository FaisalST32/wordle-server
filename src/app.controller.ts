import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { CreateGameData, GameData } from './dtos/game';
import { GameService } from './game.service';

@Controller('games')
export class AppController {
  constructor(private readonly gameService: GameService) {}

  @Post('join')
  async joinGame(
    @Body() details: CreateGameData,
    @Res({ passthrough: true }) response: Response,
  ): Promise<GameData> {
    try {
      const gameDetails = await this.gameService.joinGame(details.userId);
      const opponentId =
        gameDetails.player1.name === details.userId
          ? gameDetails.player2.name
          : gameDetails.player1.name;
      return {
        opponentId,
        gameId: gameDetails.id,
      };
    } catch (err) {
      response.status(HttpStatus.BAD_REQUEST).send({ error: err.message });
      return;
    }
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

  @Get('game/:gameId/wordle')
  async getWordle(
    @Param() params,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { gameId } = params;
    const canRetrieveWordle: boolean = await this.gameService.canRetrieveWordle(
      gameId,
    );
    if (!canRetrieveWordle) {
      response
        .status(HttpStatus.BAD_REQUEST)
        .send({ error: 'You cannot retrieve the wordle for this game' });
      return;
    }
    const wordle = await this.gameService.getWordle(gameId);
    return { wordle };
  }
}
