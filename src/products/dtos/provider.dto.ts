import { ApiProperty, PartialType } from '@nestjs/swagger';

import { IsEmail, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateProviderDto {
  @IsString()
  @Length(2, 255)
  @ApiProperty({ description: 'The company or person the products are bought from' })
  readonly name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiProperty({ description: 'The person to talk to', required: false })
  readonly contactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @ApiProperty({ required: false })
  readonly phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  @ApiProperty({ required: false })
  readonly email?: string;
}

export class UpdateProviderDto extends PartialType(CreateProviderDto) {}
