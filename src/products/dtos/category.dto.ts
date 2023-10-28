import { ApiProperty, PartialType } from '@nestjs/swagger';

import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @Length(3)
  @MaxLength(255)
  @ApiProperty({ description: 'A simple name for the category' })
  readonly name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'A simple image for the category' })
  readonly image?: string;
}
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
