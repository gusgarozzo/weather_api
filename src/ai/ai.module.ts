import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from 'src/redis/redis.service';
import { WeatherService } from 'src/weather/service/weather.service';
import { AiService } from './service/ai.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [WeatherService, RedisService, AiService],
  controllers: [],
})
export class AiModule {}
