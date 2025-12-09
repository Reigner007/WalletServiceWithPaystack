import { IsString, IsNumber, Min, IsNotEmpty } from 'class-validator';

export class TransferDto {
  @IsString()
  @IsNotEmpty()
  wallet_number: string;

  @IsNumber()
  @Min(1)
  amount: number;
}