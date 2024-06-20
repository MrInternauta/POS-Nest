import { ApiProperty, PartialType } from '@nestjs/swagger';

import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUrl } from 'class-validator';

export class CreateProductDto {
  @IsOptional()
  @IsNumber()
  @ApiProperty()
  readonly id?: number;

  @IsNotEmpty({ message: `The name field can't be empty` })
  @IsString()
  @ApiProperty({ description: 'A simple name for the product' })
  readonly name: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  readonly description?: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  readonly code: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @ApiProperty()
  readonly price: number;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @ApiProperty()
  readonly priceSell: number;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @ApiProperty()
  readonly stock: number;

  @IsOptional()
  @IsUrl()
  @ApiProperty()
  readonly image?: string;

  @IsOptional()
  @ApiProperty()
  @IsNumber()
  readonly categoryId?: number;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
