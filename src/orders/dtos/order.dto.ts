import { ApiProperty, PartialType } from '@nestjs/swagger';

import { IsNotEmpty, IsPositive } from 'class-validator';

export class CreateOrderDto {
  @IsPositive()
  @IsNotEmpty()
  @ApiProperty({ description: 'userId' })
  readonly userId: number;
}

export class UpdateOrderDto extends PartialType(CreateOrderDto) {}
