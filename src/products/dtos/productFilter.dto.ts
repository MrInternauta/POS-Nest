import { ApiProperty } from '@nestjs/swagger';

import { IsIn, IsOptional, IsPositive, IsString, Min, ValidateIf } from 'class-validator';

import { FilterDto } from '../../core/interfaces/filter.dto';

export const PRODUCT_ORDER_BY = ['name', 'code', 'price', 'priceSell', 'stock'] as const;
export type ProductOrderBy = (typeof PRODUCT_ORDER_BY)[number];

export const ORDER_DIRECTION = ['ASC', 'DESC'] as const;
export type OrderDirection = (typeof ORDER_DIRECTION)[number];

export class ProductsFilterDto extends FilterDto {
  @IsOptional()
  @Min(0)
  @ApiProperty({ description: 'minPrice', required: false })
  minPrice?: number;

  @ValidateIf(item => item.minPrice)
  @IsPositive()
  @ApiProperty({ description: 'maxPrice', required: false })
  maxPrice?: number;

  @IsOptional()
  @IsPositive()
  @ApiProperty({ description: 'categoryId', required: false })
  categoryId?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Free text matched against name, description and code', required: false })
  search?: string;

  @IsOptional()
  @IsIn(PRODUCT_ORDER_BY)
  @ApiProperty({ description: `Column to sort by: ${PRODUCT_ORDER_BY.join(', ')}`, required: false })
  orderBy?: ProductOrderBy;

  @IsOptional()
  @IsIn(ORDER_DIRECTION)
  @ApiProperty({ description: 'ASC or DESC', required: false })
  order?: OrderDirection;
}
