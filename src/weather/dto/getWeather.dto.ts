import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class getWeahterDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    type: 'string',
    example: 'Buenos Aires',
    description: 'City to check weather',
    required: false
  })
  city?: string;
}