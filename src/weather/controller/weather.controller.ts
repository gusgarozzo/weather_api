import { Controller, Get, HttpCode, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { getWeahterDto } from '../dto/getWeather.dto';
import { WeatherService } from '../service/weather.service';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get()
  @HttpCode(200)
  @ApiQuery({
    name: 'city',
    required: false,
    type: String,
    description: 'Name of the city to check weather',
    example: 'Buenos Aires'
  })
  @ApiOperation({ summary: 'Check the wheather' })
  async getWeather(@Query('city') params: getWeahterDto) {
    return this.weatherService.getWeather(params.city);
  }
}
