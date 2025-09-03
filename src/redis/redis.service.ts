import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private redisClient: Redis

  constructor(  
    private readonly configService: ConfigService
  ) {
    this.redisClient = new Redis ({
      host: this.configService.get<string>('REDIS_HOST') as string,
      port: this.configService.get<number>('REDIS_PORT') as number,
      password: this.configService.get<string>('REDIS_PASSWORD') as string
    })
  }

  async get(key: string): Promise<any> {
    const data = await this.redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttlSeconds: number) {
    await this.redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }
}
