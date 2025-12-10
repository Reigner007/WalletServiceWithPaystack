import { IsString, IsArray, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum ExpiryPeriod {
  HOUR = '1H',
  DAY = '1D',
  MONTH = '1M',
  YEAR = '1Y',
}

export class CreateApiKeyDto {
  @ApiProperty({ example: 'wallet-service', description: 'Name for the API key' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    example: ['deposit', 'transfer', 'read'], 
    description: 'Permissions for the API key',
    isArray: true
  })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];

  @ApiProperty({ 
    example: '1D', 
    description: 'Expiry period (1H, 1D, 1M, 1Y)',
    enum: ExpiryPeriod
  })
  @IsEnum(ExpiryPeriod)
  expiry: ExpiryPeriod;
}