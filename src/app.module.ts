import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { RedisService } from './redis/redis.service';
import * as Joi from 'joi';
import { ConfigModule } from '@nestjs/config';
import { WeatherModule } from './weather/weather.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
      validationSchema: Joi.object({
        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.string().required(),
        //        REDIS_PASSWORD: Joi.string().required()
      }),
      isGlobal: true,
    }),
    WeatherModule,
    AiModule,
  ],
  controllers: [],
  providers: [AppService, RedisService],
})
export class AppModule {}
