import { IsString, IsNumber, IsNotEmpty, IsPositive, IsOptional } from 'class-validator';

export class CreatePaymentIntentDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsOptional()
  idempotencyKey?: string; 
}


export class ConfirmPaymentIntentDto {
  @IsString()
  @IsNotEmpty()
  paymentIntentId: string;

  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;
}
