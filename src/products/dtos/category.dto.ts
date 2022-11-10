import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, Length, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @Length(3)
  @MaxLength(255)
  @ApiProperty({ description: 'A simple name for the category' })
  readonly name: string;
}
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
