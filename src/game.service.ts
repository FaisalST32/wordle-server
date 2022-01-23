import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { RowData } from './dtos/play';
import {
  Game,
  GameDocument,
  GameMode,
  GamePlayer,
  GameStatus,
  OngoingGame,
} from './schemas/game.schema';
import { LetterState, WordsService } from './words.service';

@Injectable()
export class GameService {
  constructor(
    @InjectModel(Game.name) private gameModel: Model<GameDocument>,
    private wordsService: WordsService,
  ) {}

  async joinGame(userId: string): Promise<OngoingGame> {
    let newGame: GameDocument;
    try {
      const foundGame = await this.gameModel.findOne({
        status: GameStatus.Pending,
        'config.mode': GameMode.Online,
        gameCode: { $in: ['', null] },
      });
      // console.log(foundGame);
      // console.log({ foundGame });
      if (foundGame) {
        foundGame.status = GameStatus.Started;
        foundGame.player2 = { ...foundGame.player2, name: userId };
        const game = await foundGame.save();
        return {
          gameId: game.id,
          opponentId:
            game.player1.name === userId
              ? game.player2.name
              : game.player1.name,
        };
      }
      newGame = await this.createSoloGame(userId);
      const startedGame = await this.pollForPlayerJoined(newGame._id);
      return {
        gameId: startedGame.id,
        opponentId:
          startedGame.player1.name === userId
            ? startedGame.player2.name
            : startedGame.player1.name,
      };
    } catch (err) {
      if (newGame) {
        newGame.status = GameStatus.Cancelled;
        await newGame.save();
      }
      throw err;
    }
  }

  async createSoloGame(userId: string, isSolo = false): Promise<GameDocument> {
    const gameData: Game = {
      status: isSolo ? GameStatus.Started : GameStatus.Pending,
      player1: { name: userId, rows: [], statuses: [] },
      player2: { name: '', rows: [], statuses: [] },
      winner: '',
      wordle: this.wordsService.generateWordle(),
      config: { mode: isSolo ? GameMode.Solo : GameMode.Online },
    };
    const newGame = new this.gameModel(gameData);
    await newGame.save();
    return newGame;
  }

  async generateNewGameCode(userId: string): Promise<GameDocument> {
    const gameData: Game = {
      status: GameStatus.Pending,
      player1: { name: userId, rows: [], statuses: [] },
      player2: { name: '', rows: [], statuses: [] },
      winner: '',
      wordle: this.wordsService.generateWordle(),
      config: { mode: GameMode.Online },
      gameCode: this.getRandomWord(5),
    };
    const newGame = new this.gameModel(gameData);
    await newGame.save();
    return newGame;
  }

  async joinFromCode(userId: string, gameCode: string): Promise<OngoingGame> {
    const foundGame = await this.gameModel.findOne({
      gameCode,
      status: { $ne: GameStatus.Finished },
    });
    if (!foundGame) {
      throw new Error('Cannot find a game with that code');
    }
    if (
      foundGame.player1.name &&
      foundGame.player2.name &&
      ![foundGame.player1.name, foundGame.player2.name].includes(userId)
    ) {
      throw new Error('The game already has maximum allowed players');
    }
    const currentPlayerProp =
      foundGame.player1.name === userId ? 'player1' : 'player2';
    const opponentPlayerProp =
      currentPlayerProp === 'player1' ? 'player2' : 'player1';

    if (foundGame.status === GameStatus.Started) {
      return {
        gameId: foundGame.id,
        opponentMoves: foundGame[opponentPlayerProp].statuses,
        moves: this.mergeRowsAndStatuses(
          foundGame[currentPlayerProp].rows,
          foundGame[currentPlayerProp].statuses,
        ),
        opponentId: foundGame[opponentPlayerProp].name,
      };
    }

    const shouldWaitForOpponentToJoin =
      foundGame.player1.name === userId && !foundGame.player2.name;

    if (shouldWaitForOpponentToJoin) {
      const startedGame = await this.pollForPlayerJoinedWithCode(foundGame.id);
      return {
        gameId: startedGame.id,
        opponentId: startedGame.player2.name,
      };
    }
    foundGame.status = GameStatus.Started;
    foundGame.player2 = { ...foundGame.player2, name: userId };
    const game = await foundGame.save();
    return {
      gameId: game.id,
      opponentId: game.player1.name,
    };
  }

  getGameStatus() {
    return 'ongoing';
  }

  async pollForPlayerJoined(gameId: ObjectId): Promise<GameDocument> {
    return new Promise((res, rej) => {
      const interval = setInterval(async () => {
        const startedGame = await this.gameModel.findOne({
          _id: gameId,
          status: GameStatus.Started,
          'config.mode': GameMode.Online,
          gameCode: { $in: ['', null] },
        });
        if (startedGame) {
          clearInterval(interval);
          clearTimeout(timeout);
          res(startedGame);
        }
      }, 1000);

      const timeout = setTimeout(() => {
        clearInterval(interval);
        rej(new Error("Couldn't find a game"));
      }, 30000);
    });
  }

  async pollForPlayerJoinedWithCode(gameId: ObjectId): Promise<GameDocument> {
    return new Promise((res) => {
      const interval = setInterval(async () => {
        const startedGame = await this.gameModel.findOne({
          _id: gameId,
          status: GameStatus.Started,
          'config.mode': GameMode.Online,
          gameCode: { $nin: ['', null] },
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
      throw new Error('The entered word is not valid');
    }

    const playerProp: string =
      rowData.playerName === game.player1.name ? 'player1' : 'player2';

    const player: GamePlayer = game[playerProp];

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

  async canRetrieveWordle(gameId: string): Promise<boolean> {
    const foundGame = await this.gameModel.findById(gameId);
    if (!foundGame) {
      return false;
    }
    if (foundGame.config.mode !== GameMode.Solo) {
      return false;
    }
    if (foundGame.player1.rows.length !== 6) {
      return false;
    }
    return true;
  }

  async clearObsoleteData() {
    const currentDate = new Date();
    const daysOlderThan = 5;
    currentDate.setDate(currentDate.getDate() - daysOlderThan);
    return this.gameModel.updateMany(
      {
        createdAt: { $lte: currentDate },
        status: GameStatus.Pending,
      },
      {
        status: GameStatus.Cancelled,
      },
    );
  }

  async getWordle(gameId: string): Promise<string> {
    const foundGame = await this.gameModel.findById(gameId);
    if (!foundGame) {
      throw new Error('Game not found');
    }
    return foundGame.wordle;
  }

  private getRandomWord(length: number): string {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
  private mergeRowsAndStatuses(
    rows: string[],
    statuses: LetterState[][],
  ): { character: string; state: LetterState }[][] {
    return statuses.map((status: LetterState[], i: number) => {
      const row = rows[i];
      return status.map((statusItem: LetterState, j: number) => ({
        character: row[j],
        state: statusItem,
      }));
    });
  }
}
