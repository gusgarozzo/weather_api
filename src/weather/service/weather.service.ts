import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { RedisService } from 'src/redis/redis.service';
import { IWeatherResponse } from '../interfaces/weather-response.interface';
import { UrlEnum } from '../enum/weather-api-url.enum';

@Injectable()
export class WeatherService {
  private apiKey: string;
  private unitGroup: string;
  private contentType: string;
  private defaultCity: string;
  private cacheTTL: number;
  private lang: string;

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
    this.lang = this.configService.get<string>('VS_LANG', 'us') as string;
  }

  async getWeather(city?: string): Promise<IWeatherResponse> {
    try {
      const location = encodeURIComponent(city || this.defaultCity);
      const cacheKey = `weather:${location.toLowerCase()}`;

      await this.cacheCheck(cacheKey);

      const url = this.buildWeatherUrl(location);

      const response = await axios.get<IWeatherResponse>(url);
      await this.saveInCache(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw new Error(
        `Weather API request failed: ${(error as Error).message}`,
      );
    }
  }

  private async cacheCheck(cacheKey: string): Promise<any> {
    try {
      const cached = await this.redisService.get(cacheKey);

      if (cached) return cached;
    } catch (error) {
      throw error;
    }
  }

  private async saveInCache(
    cacheKey: string,
    response: IWeatherResponse,
  ): Promise<void> {
    try {
      await this.redisService.set(cacheKey, response, this.cacheTTL);
    } catch (error) {
      throw error;
    }
  }

  private buildWeatherUrl(location: string): string {
    const params = new URLSearchParams({
      unitGroup: this.unitGroup,
      key: this.apiKey,
      contentType: this.contentType,
      lang: this.lang,
    });

    return `${UrlEnum.API_BASE_URL}${location}?${params.toString()}`;
  }
}
