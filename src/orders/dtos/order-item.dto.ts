import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class CreateOrderItemDto {
  @IsPositive()
  @ApiProperty()
  @IsNotEmpty()
  productId: number;

  @IsPositive()
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}
export class UpdateOrderItemDto extends PartialType(CreateOrderItemDto) {}
