import { IsNumber, Min } from 'class-validator';

export class DepositDto {
  @IsNumber()
  @Min(100)
  amount: number;
}