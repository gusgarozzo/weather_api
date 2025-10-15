import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private redisClient: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST') as string,
      port: this.configService.get<number>('REDIS_PORT') as number,
    });
  }

  async get(key: string): Promise<string | null> {
    const value = await this.redisClient.get(key);
    return value;
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    await this.redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }
}
