import { ApiProperty } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { CreateOrderItemDto } from '../../orders/dtos/order-item.dto';

/** A sale to charge on the terminal. The seller is whoever is logged in, not a field of the body. */
export class CreatePaymentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @Type(() => CreateOrderItemDto)
  @IsNotEmpty()
  @ApiProperty({ description: 'items that contain productId & quantity (number)' })
  readonly items: Array<CreateOrderItemDto>;
}

export class UpdateStoreSettingsDto {
  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  readonly mercadoPagoEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  @ApiProperty({ required: false, description: 'A terminal id from GET /payments/terminals' })
  readonly mpTerminalId?: string;
}
