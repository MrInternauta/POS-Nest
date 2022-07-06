import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, Length, MaxLength } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  @Length(3)
  @MaxLength(255)
  @ApiProperty({ description: 'A simple name for the Brand' })
  readonly name: string;

  @IsString()
  @Length(3)
  @MaxLength(255)
  @ApiProperty({ description: 'A simple image for the Brand' })
  readonly image: string;
}
export class UpdateBrandDto extends PartialType(CreateBrandDto) {}
