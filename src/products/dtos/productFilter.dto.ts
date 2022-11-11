import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsPositive, ValidateIf } from 'class-validator';

import { FilterDto } from '../../core/interfaces/filter.dto';

export class ProductsFilterDto extends FilterDto {
  @IsOptional()
  @IsPositive()
  @ApiProperty({ description: 'minPrice' })
  minPrice: number;

  @ValidateIf((item) => item.minPrice)
  @IsPositive()
  @ApiProperty({ description: 'maxPrice' })
  maxPrice: number;
}
