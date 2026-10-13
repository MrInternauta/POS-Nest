import { ApiProperty, PartialType } from '@nestjs/swagger';

import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { CreateOrderItemDto } from './order-item.dto';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  /** Who made the sale. The API always records whoever is logged in; the app still sends it */
  @IsOptional()
  @IsPositive()
  @ApiProperty({ description: 'Ignored: a sale is recorded under whoever makes it', required: false })
  readonly userId?: number;

  /** Who the sale was made to; the store's default customer when left out */
  @IsOptional()
  @IsPositive()
  @ApiProperty({ required: false })
  readonly customerId?: number;

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
