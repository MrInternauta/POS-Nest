import { ApiProperty } from '@nestjs/swagger';

import { IsOptional, IsPositive, Max, Min } from 'class-validator';

export class FilterDto {
  @IsOptional()
  @IsPositive()
  @Min(1)
  @Max(50)
  @ApiProperty({ description: 'limit for paginations' })
  limit = 10;

  @IsOptional()
  @Min(0)
  @ApiProperty({ description: 'offset for paginations' })
  offset = 0;
}
