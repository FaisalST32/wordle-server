import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GameModule } from './schemas/game.module';
import { MockModule } from './schemas/mock.module';
@Module({
  imports: [
    GameModule,
    ConfigModule.forRoot(
      (() => {
        return { ignoreEnvFile: false };
      })(),
    ),
    MongooseModule.forRoot(
      (() => {
        // console.log({ connectionString: process.env.MONGO_CONNECTION_STRING });
        return process.env.MONGO_CONNECTION_STRING;
      })(),
    ),
    MockModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
