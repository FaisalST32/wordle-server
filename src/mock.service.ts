import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Mock, MockDocument } from './schemas/mock.schema';

@Injectable()
export class MockService {
  constructor(@InjectModel(Mock.name) private mockModel: Model<MockDocument>) {}
  addNewMock(key: string, data: any) {
    console.log({ key, data });
    const newMock = new this.mockModel({ key, data });
    return newMock.save();
  }

  getMockedData(key: string) {
    return this.mockModel.findOne({ key });
  }
}
