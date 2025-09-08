import { IsOptional, IsString } from 'class-validator';

export class getWeahterDto {
  @IsOptional()
  @IsString()
  city?: string;
}