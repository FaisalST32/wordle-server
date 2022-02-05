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
import {
  CheckGameData,
  CreateGameData,
  GameData,
  JoinGameFromCodeData,
} from './dtos/game';
import { GameService } from './game.service';
import { OngoingGame } from './schemas/game.schema';

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

      return {
        opponentId: gameDetails.opponentId,
        gameId: gameDetails.gameId,
      };
    } catch (err) {
      response.status(HttpStatus.BAD_REQUEST).send({ error: err.message });
      return;
    }
  }

  @Post('join-or-create')
  async joinOrCreateGame(
    @Body() details: CreateGameData,
    @Res({ passthrough: true }) response: Response,
  ): Promise<GameData> {
    try {
      const gameDetails = await this.gameService.joinGameOrCreateNew(
        details.userId,
      );

      return gameDetails;
    } catch (err) {
      response.status(HttpStatus.BAD_REQUEST).send({ error: err.message });
      return;
    }
  }

  @Post('v2/join-with-code')
  async joinFromCodeWithoutPolling(
    @Body() details: JoinGameFromCodeData,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Partial<OngoingGame>> {
    try {
      const gameDetails = await this.gameService.joinFromCodeWithoutPolling(
        details.userId,
        details.gameCode,
      );
      return gameDetails;
    } catch (err) {
      response.status(HttpStatus.BAD_REQUEST).send({ error: err.message });
      return;
    }
  }

  @Post('poll-for-player')
  async pollForPlayer(
    @Body() details: CheckGameData,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Partial<OngoingGame>> {
    try {
      const gameDetails: Partial<OngoingGame> =
        await this.gameService.checkIfAnOpponentJoined(
          details.gameId,
          details.playerId,
        );
      return gameDetails;
    } catch (err) {
      response.status(HttpStatus.BAD_REQUEST).send({ error: err.message });
      return;
    }
  }

  @Post('join-solo')
  async createSoloGame(@Body() details: CreateGameData) {
    const gameDetails = await this.gameService.createNewGame(
      details.userId,
      true,
    );
    return {
      gameId: gameDetails.id,
    };
  }

  @Post('generate-code')
  async generateGameCode(
    @Body() details: CreateGameData,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const gameDetails = await this.gameService.generateNewGameCode(
        details.userId,
      );
      return {
        gameId: gameDetails.id,
        gameCode: gameDetails.gameCode,
      };
    } catch (err) {
      response.status(HttpStatus.BAD_REQUEST).send({ error: err.message });
      return;
    }
  }

  @Post('join-with-code')
  async joinGameWithCode(
    @Body() details: JoinGameFromCodeData,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const gameDetails = await this.gameService.joinFromCode(
        details.userId,
        details.gameCode,
      );
      return gameDetails;
    } catch (err) {
      response.status(HttpStatus.BAD_REQUEST).send({ error: err.message });
      return;
    }
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
