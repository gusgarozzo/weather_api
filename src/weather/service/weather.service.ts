import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class WeatherService {
  private apiKey: string;
  private unitGroup: string;
  private contentType: string;
  private defaultCity: string;
  private cacheTTL: number;

  constructor(
    private readonly redisService: RedisService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('VC_API_KEY') as string;
    this.unitGroup = this.configService.get<string>(
      'VC_UNIT_GROUP',
      'us',
    ) as string;
    this.contentType = this.configService.get<string>(
      'VC_CONTENT_TYPE',
      'json',
    ) as string;
    this.defaultCity = this.configService.get<string>(
      'VC_DEFAULT_CITY',
      'Tandil',
    ) as string;
    this.cacheTTL = this.configService.get<number>(
      'CACHE_TTL_SECONDS',
      600,
    ) as number;
  }

  async getWeather(city?: string): Promise<any> {
    try {
      if (!city) return { error: 'City is required' };

      const location = encodeURIComponent(city || this.defaultCity);
      const cacheKey = `weather:${location.toLowerCase()}`;

      const cached = await this.cacheCheck(cacheKey);

      const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}?unitGroup=${this.unitGroup}&key=${this.apiKey}&contentType=${this.contentType}`;
      const response = await axios.get(url);

      await this.saveInCache(cacheKey, response);

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // TODO: tipar
  private async cacheCheck(cacheKey: string): Promise<any> {
    try {
      const cached = await this.redisService.get(cacheKey);

      if (cached) return cached;
    } catch (error) {
      throw error;
    }
  }

  // TODO: tipar
  private async saveInCache(cacheKey, response): Promise<void> {
    await this.redisService.set(cacheKey, response.data, this.cacheTTL);
  }
}
