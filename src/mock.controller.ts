import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { NewMockDtoType } from './dtos/mock';
import { MockService } from './mock.service';
import { getRandomWord } from './utilities/string.utils';
import { isValidMockKey } from './utilities/validation.utils';

@Controller('mock')
export class MockController {
  constructor(private readonly mockService: MockService) {}

  @Post()
  async addNewMock(@Body() requestData: NewMockDtoType) {
    const { data, key } = requestData;
    const keyToUse = key || getRandomWord(6);

    const isValidKey = isValidMockKey(keyToUse);
    if (!isValidKey) {
      return new BadRequestException(
        'key must only contain letters, numbers or dashes',
      );
    }

    const savedMock = await this.mockService.addNewMock(keyToUse, data);
    console.log(savedMock);
    return { key: keyToUse };
  }

  @Get(':key')
  async getMockedData(@Param('key') key: string) {
    const mockedData = await this.mockService.getMockedData(key);
    if (!mockedData) {
      return new NotFoundException('Cannot find data with the specified key');
    }
    console.log(mockedData.data);
    return mockedData.data;
  }
}
