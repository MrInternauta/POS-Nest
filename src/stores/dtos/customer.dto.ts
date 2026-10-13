import { ApiProperty, PartialType } from '@nestjs/swagger';

import { IsEmail, IsOptional, IsString, Length, MaxLength } from 'class-validator';

import { FilterDto } from '../../core/interfaces/filter.dto';

export class CreateCustomerDto {
  @IsString()
  @Length(1, 255)
  @ApiProperty()
  readonly name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @ApiProperty({ required: false })
  readonly phone?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  @ApiProperty({ required: false })
  readonly email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @ApiProperty({ required: false })
  readonly notes?: string | null;
}

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}

export class CustomerFilterDto extends FilterDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiProperty({ required: false, description: 'Matched against name, phone and email' })
  search?: string;
}
