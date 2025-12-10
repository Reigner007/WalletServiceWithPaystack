import { IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum ExpiryPeriod {
  HOUR = '1H',
  DAY = '1D',
  MONTH = '1M',
  YEAR = '1Y',
}

export class RolloverApiKeyDto {
  @ApiProperty({ example: 'uuid-of-expired-key', description: 'ID of the expired API key' })
  @IsString()
  @IsNotEmpty()
  expired_key_id: string;

  @ApiProperty({ 
    example: '1M', 
    description: 'Expiry period for new key (1H, 1D, 1M, 1Y)',
    enum: ExpiryPeriod
  })
  @IsEnum(ExpiryPeriod)
  expiry: ExpiryPeriod;
}