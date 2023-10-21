import { ApiProperty } from '@nestjs/swagger';

import { IsOptional, IsPositive, Min } from 'class-validator';

export class FilterDto {
  @IsOptional()
  @IsPositive()
  @ApiProperty({ description: 'limit for paginations' })
  limit = 10;

  @IsOptional()
  @Min(0)
  @ApiProperty({ description: 'offset for paginations' })
  offset = 0;
}
