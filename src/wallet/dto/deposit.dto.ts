import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DepositDto {
  @ApiProperty({ example: 5000, description: 'Amount to deposit (minimum 100)', minimum: 100 })
  @IsNumber()
  @Min(100)
  amount: number;
}