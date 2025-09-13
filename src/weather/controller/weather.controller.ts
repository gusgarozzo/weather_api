import { Controller, Get, HttpCode, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { getWeahterDto } from '../dto/getWeather.dto';
import { WeatherService } from '../service/weather.service';
import { AiService } from 'src/ai/service/ai.service';

@Controller('weather')
export class WeatherController {
  constructor(
    private readonly weatherService: WeatherService,
    private readonly aiService: AiService,
  ) {}

  @Get()
  @HttpCode(200)
  @ApiQuery({
    name: 'city',
    required: false,
    type: String,
    description: 'Name of the city to check weather',
    example: 'Buenos Aires',
  })
  @ApiOperation({ summary: 'Check the wheather' })
  async getWeather(@Query('city') params: getWeahterDto) {
    return this.weatherService.getWeather(params.city);
  }

  @Get('/ia')
  @HttpCode(200)
  @ApiQuery({
    name: 'city',
    required: false,
    type: String,
    description: 'Name of the city to check weather (AI-enhanced)',
    example: 'Buenos Aires',
  })
  @ApiOperation({ summary: 'Check the weather with AI-enriched response' })
  async getWeatherAI(@Query('city') params: getWeahterDto) {
    return this.aiService.enrichWeather(params.city);
  }
}
