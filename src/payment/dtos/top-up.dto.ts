import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class TopUpDto {
  @IsString()
  @IsNotEmpty()
  customer: string; // Stripe Customer ID

  @IsNumber()
  @IsPositive()
  amount: number; // Amount to top up in the smallest currency unit (e.g., cents for USD)
}
