import { Controller, Get, HttpCode, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { WeatherService } from '../service/weather.service';
import { getWeahterDto } from '../dto/getWeather.dto';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({ summary: 'Check the wheather' })
  async getWeather(@Query('city') params: getWeahterDto) {
    return this.weatherService.getWeather(params.city);
  }
}
