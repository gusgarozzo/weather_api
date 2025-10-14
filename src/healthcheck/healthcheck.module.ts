import { Module } from '@nestjs/common';
import { HealthcheckController } from './controller/healthcheck.controller';

@Module({
  providers: [],
  controllers: [HealthcheckController]
})
export class HealthcheckModule {}
