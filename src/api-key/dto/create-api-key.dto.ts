import { IsString, IsArray, IsEnum, IsNotEmpty } from 'class-validator';

enum ExpiryPeriod {
  HOUR = '1H',
  DAY = '1D',
  MONTH = '1M',
  YEAR = '1Y',
}

export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsString({ each: true })
  permissions: string[];

  @IsEnum(ExpiryPeriod)
  expiry: ExpiryPeriod;
}