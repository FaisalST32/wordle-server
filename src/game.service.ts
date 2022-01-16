import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { RowData } from './dtos/play';
import {
  Game,
  GameDocument,
  GamePlayer,
  GameStatus,
} from './schemas/game.schema';
import { WordsService } from './words.service';

@Injectable()
export class GameService {
  constructor(
    @InjectModel(Game.name) private gameModel: Model<GameDocument>,
    private wordsService: WordsService,
  ) {}

  async joinGame(userId: string): Promise<GameDocument> {
    const foundGame = await this.gameModel.findOne({
      status: GameStatus.Pending,
    });
    console.log({ foundGame });
    if (foundGame) {
      foundGame.status = GameStatus.Started;
      foundGame.player2 = { ...foundGame.player2, name: userId };
      const game = await foundGame.save();
      return game;
    }
    const newGame = await this.createGame(userId);
    const startedGame = await this.pollForPlayerJoined(newGame._id);
    return startedGame;
  }

  async createGame(userId: string, isSolo = false): Promise<GameDocument> {
    const gameData: Game = {
      status: isSolo ? GameStatus.Started : GameStatus.Pending,
      player1: { name: userId, rows: [], statuses: [] },
      player2: { name: '', rows: [], statuses: [] },
      winner: '',
      // TODO: Use a service dummy
      wordle: this.wordsService.generateWordle(),
    };
    const newGame = new this.gameModel(gameData);
    await newGame.save();
    return newGame;
  }

  getGameStatus() {
    return 'ongoing';
  }

  async pollForPlayerJoined(gameId: ObjectId): Promise<GameDocument> {
    return new Promise((res) => {
      const interval = setInterval(async () => {
        const startedGame = await this.gameModel.findOne({
          _id: gameId,
          status: GameStatus.Started,
        });
        if (startedGame) {
          clearInterval(interval);
          res(startedGame);
        }
      }, 1000);
    });
  }

  async recordRowEntry(rowData: RowData) {
    const game = await this.gameModel.findById(rowData.gameId);
    if (!game) {
      throw new Error('Game not found');
    }
    if (game.status !== GameStatus.Started) {
      throw new Error('The game is not currently ongoing');
    }

    const isValidWord: boolean = await this.wordsService.checkIfWordExists(
      rowData.word,
    );
    if (!isValidWord) {
      throw new Error('The entered word is not correct');
    }

    const playerProp: string =
      rowData.playerName === game.player1.name ? 'player1' : 'player2';

    const player: GamePlayer =
      rowData.playerName === game.player1.name ? game.player1 : game.player2;

    console.log(player);
    if (player.name !== rowData.playerName) {
      throw new Error('That player does not belong to this game');
    }
    await game.update({ $push: { [`${playerProp}.rows`]: rowData.word } });

    const rowResponse = this.wordsService.populateRowResponse(
      game.wordle,
      rowData.word,
    );
    await game.update({ $push: { [`${playerProp}.statuses`]: rowResponse } });

    const isGameFinished = rowResponse.every((status) => status === 'valid');
    if (isGameFinished) {
      game.status = GameStatus.Finished;
      game.winner = rowData.playerName;
      await game.save();
    }

    return { rowResponse, status: game.status };
  }

  async getPlayerStatus(gameId: string, playerId: string) {
    const foundGame = await this.gameModel.findById(gameId);
    if (!foundGame) {
      throw new Error("Cannot find the game that you're looking for");
    }
    const player: GamePlayer =
      playerId === foundGame.player1.name
        ? foundGame.player1
        : foundGame.player2;

    if (player.name !== playerId) {
      throw new Error('That player does not belong to this game');
    }

    return {
      gameStatus: foundGame.status,
      playerStatuses: player.statuses,
      wordle:
        foundGame.status === GameStatus.Finished &&
        foundGame.winner === playerId
          ? foundGame.wordle
          : '',
    };
  }
}
