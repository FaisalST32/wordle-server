import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MockController } from 'src/mock.controller';
import { MockService } from 'src/mock.service';
import { Mock, MockSchema } from './mock.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Mock.name, schema: MockSchema }]),
  ],
  controllers: [MockController],
  providers: [MockService],
})
export class MockModule {}
