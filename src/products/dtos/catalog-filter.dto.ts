import { ApiProperty } from '@nestjs/swagger';

import { IsOptional, IsString, MaxLength } from 'class-validator';

import { FilterDto } from '../../core/interfaces/filter.dto';

export class CatalogFilterDto extends FilterDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiProperty({ description: 'Matched against name and code', required: false })
  search?: string;
}
