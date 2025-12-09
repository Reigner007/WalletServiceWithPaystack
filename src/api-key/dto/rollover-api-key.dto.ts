import { IsString, IsEnum, IsNotEmpty } from 'class-validator';

enum ExpiryPeriod {
  HOUR = '1H',
  DAY = '1D',
  MONTH = '1M',
  YEAR = '1Y',
}

export class RolloverApiKeyDto {
  @IsString()
  @IsNotEmpty()
  expired_key_id: string;

  @IsEnum(ExpiryPeriod)
  expiry: ExpiryPeriod;
}