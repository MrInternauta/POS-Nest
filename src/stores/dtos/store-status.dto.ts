import { ApiProperty } from '@nestjs/swagger';

import { IsBoolean } from 'class-validator';

export class StoreStatusDto {
  @IsBoolean()
  @ApiProperty({ description: 'A switched off store cannot be worked in, and has no public catalogue' })
  readonly active: boolean;
}
