import { ApiProperty } from '@nestjs/swagger';

import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class RoleDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: '' })
  readonly name: string;

  @IsArray()
  permissions: PermissionDto[];
}

export class PermissionDto {
  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: '' })
  readonly id?: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: '' })
  readonly name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: '' })
  readonly description: string;
}
