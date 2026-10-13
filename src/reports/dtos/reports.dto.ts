import { ApiProperty } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export const PERIODS = ['day', 'week', 'month'] as const;
export type Period = (typeof PERIODS)[number];

export const TOP_PRODUCTS_BY = ['qty', 'revenue'] as const;
export type TopProductsBy = (typeof TOP_PRODUCTS_BY)[number];

export class SummaryDto {
  @IsOptional()
  @IsIn(PERIODS)
  @ApiProperty({ enum: PERIODS, required: false, description: 'Defaults to day' })
  period: Period = 'day';
}

export class TopProductsDto {
  @IsOptional()
  @IsDateString({ strict: true })
  @ApiProperty({ required: false, description: 'YYYY-MM-DD, store date. Defaults to the first of this month' })
  from?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  @ApiProperty({ required: false, description: 'YYYY-MM-DD, store date, included. Defaults to today' })
  to?: string;

  @IsOptional()
  //A query value is a string, and lint drops a `: number` that would let Nest convert it
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @ApiProperty({ required: false })
  limit = 10;

  @IsOptional()
  @IsIn(TOP_PRODUCTS_BY)
  @ApiProperty({ enum: TOP_PRODUCTS_BY, required: false })
  by: TopProductsBy = 'qty';
}

export class MonthlyDto {
  @IsOptional()
  //A query value is a string, and lint drops a `: number` that would let Nest convert it
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(36)
  @ApiProperty({ required: false })
  months = 12;
}
