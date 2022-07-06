import {
  IsString,
  IsNumber,
  IsUrl,
  IsNotEmpty,
  IsPositive,
  IsOptional,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateProductDto {
  @IsNotEmpty({ message: `The name field can't be empty` })
  @IsString()
  @ApiProperty({ description: 'A simple name for the product' })
  readonly name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  readonly description: string;
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @ApiProperty()
  readonly price: number;
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @ApiProperty()
  readonly stock: number;
  @IsNotEmpty()
  @IsUrl()
  @ApiProperty()
  readonly image: string;

  @IsOptional()
  @IsPositive()
  @ApiProperty()
  readonly categtoryId: number;

  @IsOptional()
  @IsPositive()
  @ApiProperty()
  readonly brandId: number;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
