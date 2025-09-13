import { Module } from '@nestjs/common';
import { WeatherService } from './service/weather.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from 'src/redis/redis.service';
import { WeatherController } from './controller/weather.controller';
import { AiService } from 'src/ai/service/ai.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [WeatherService, RedisService, AiService],
  controllers: [WeatherController],
})
export class WeatherModule {}
