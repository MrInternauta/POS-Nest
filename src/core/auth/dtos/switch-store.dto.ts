import { ApiProperty } from '@nestjs/swagger';

import { IsInt, IsPositive } from 'class-validator';

export class SwitchStoreDto {
  @IsInt()
  @IsPositive()
  @ApiProperty()
  readonly storeId: number;
}
