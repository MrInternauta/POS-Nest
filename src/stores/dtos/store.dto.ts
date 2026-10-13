import { ApiProperty, PartialType } from '@nestjs/swagger';

import { IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator';

/**
 * The zones the runtime knows, so a report never asks Postgres for one it does not. Node has had
 * supportedValuesOf since 18; the TypeScript lib in use predates it
 */
const TIME_ZONES = (Intl as unknown as { supportedValuesOf(key: 'timeZone'): string[] }).supportedValuesOf('timeZone');

export class CreateStoreDto {
  @IsString()
  @Length(2, 255)
  @ApiProperty({ description: 'The name customers know the store by' })
  readonly name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @ApiProperty({ required: false })
  readonly phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiProperty({ required: false })
  readonly address?: string;

  @IsOptional()
  @IsIn(TIME_ZONES)
  @ApiProperty({
    required: false,
    default: 'America/Mexico_City',
    description: 'Days in the reports start in this zone',
  })
  readonly timezone?: string;
}

export class UpdateStoreDto extends PartialType(CreateStoreDto) {}
