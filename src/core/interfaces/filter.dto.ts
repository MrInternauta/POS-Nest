import { ApiProperty } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class FilterDto {
  //A query value is a string: without @Type a ?limit=20 failed the number checks with a 400
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @ApiProperty({ description: 'limit for paginations', required: false })
  limit = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiProperty({ description: 'offset for paginations', required: false })
  offset = 0;
}
