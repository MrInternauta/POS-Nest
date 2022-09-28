import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsPositive, IsString, IsUrl } from 'class-validator';

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

  @IsNotEmpty()
  @IsArray()
  @ApiProperty()
  readonly categoryIds: number[];

  @IsNotEmpty()
  @IsPositive()
  @ApiProperty()
  readonly brandId: number;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
