import { IsString, IsNumber, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferDto {
  @ApiProperty({ example: '1733780123456', description: 'Recipient wallet number' })
  @IsString()
  @IsNotEmpty()
  wallet_number: string;

  @ApiProperty({ example: 1000, description: 'Amount to transfer', minimum: 1 })
  @IsNumber()
  @Min(1)
  amount: number;
}