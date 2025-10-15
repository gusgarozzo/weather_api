import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { RedisService } from '../../redis/redis.service';
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
    this.unitGroup = this.configService.get<string>('VC_UNIT_GROUP', 'us');
    this.contentType = this.configService.get<string>(
      'VC_CONTENT_TYPE',
      'json',
    );
    this.defaultCity = this.configService.get<string>(
      'VC_DEFAULT_CITY',
      'Tandil',
    );
    this.cacheTTL =
      this.configService.get<number>('CACHE_TTL_SECONDS', 600) || 3600;
    this.lang = this.configService.get<string>('VS_LANG', 'us');
  }

  async getWeather(city?: string): Promise<IWeatherResponse> {
    try {
      const location = encodeURIComponent(city || this.defaultCity);
      const cacheKey = `weather:${location.toLowerCase()}`;

      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as IWeatherResponse;
      }

      const url = this.buildWeatherUrl(location);
      const response = await axios.get<IWeatherResponse>(url);

      await this.redisService.set(
        cacheKey,
        JSON.stringify(response.data),
        this.cacheTTL,
      );

      return response.data;
    } catch (error: unknown) {
      let errorMessage = 'Request failed with status code 500';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error
      ) {
        errorMessage = (error as { message: string }).message;
      } else if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      }

      throw new Error(`Weather API request failed: ${errorMessage}`);
    }
  }

  private async cacheCheck(
    cacheKey: string,
  ): Promise<IWeatherResponse | undefined> {
    const cached: string | null = await this.redisService.get(cacheKey);

    if (!cached) {
      return undefined;
    }

    return JSON.parse(cached) as IWeatherResponse;
  }

  private async saveInCache(
    key: string,
    data: IWeatherResponse,
  ): Promise<void> {
    await this.redisService.set(key, JSON.stringify(data), 3600);
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
