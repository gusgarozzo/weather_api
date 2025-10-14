import { Controller, Get, HttpCode } from '@nestjs/common';

@Controller('healthcheck')
export class HealthcheckController {
  
  @HttpCode(200)
  @Get('')
  healthcheck() {
    return 'OK';
  }
}
