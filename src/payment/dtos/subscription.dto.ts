import { IsString, IsNotEmpty, IsOptional, IsNumber, IsPositive } from 'class-validator';


export class UpdateSubscriptionDto {
    @IsString()
    @IsNotEmpty()
    priceId: string;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    quantity?: number; // Optional field for updating the subscription quantity
}
