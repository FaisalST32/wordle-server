import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { RowData } from './dtos/play';
import { GameService } from './game.service';

@Controller('play')
export class PlayController {
  constructor(private gameService: GameService) {}

  @Post('row')
  async sendRow(@Body() rowData: RowData, @Res() response: Response) {
    try {
      const resp = await this.gameService.recordRowEntry(rowData);
      response.status(HttpStatus.CREATED).send(resp);
    } catch (err) {
      response.status(HttpStatus.BAD_REQUEST).send({ error: err.message });
    }
  }
}
