import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GameModule } from './schemas/game.module';
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
