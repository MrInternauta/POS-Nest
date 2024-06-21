import { ApiProperty, PartialType } from '@nestjs/swagger';

import { ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, IsPositive, ValidateNested } from 'class-validator';
import { CreateOrderItemDto } from './order-item.dto';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @IsPositive()
  @IsNotEmpty()
  @ApiProperty({ description: 'userId' })
  readonly userId: number;

  //TODO: Include client ID
  //TODO: Include ammount paid

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @Type(() => CreateOrderItemDto)
  @IsNotEmpty()
  @ApiProperty({ description: 'items that contain productId & quantity (number)' })
  readonly items: Array<CreateOrderItemDto>;
}

export class UpdateOrderDto extends PartialType(CreateOrderDto) {}
