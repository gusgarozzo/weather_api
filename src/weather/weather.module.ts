import { Module } from '@nestjs/common';
import { WeatherService } from './service/weather.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from 'src/redis/redis.service';
import { WeatherController } from './controller/weather.controller';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [WeatherService, RedisService],
  controllers: [WeatherController],
})
export class WeatherModule {}
