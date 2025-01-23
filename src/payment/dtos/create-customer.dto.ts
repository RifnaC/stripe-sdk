import { IsObject } from 'class-validator';

export class CreateCustomerDto {
  @IsObject()
  metadata: Record<string, string>;
}
