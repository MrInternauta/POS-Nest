import { ApiProperty } from '@nestjs/swagger';

import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RoleDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: '' })
  readonly name: string;

  @IsArray()
  permissions: PermissionDto[];
}

export class PermissionDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: '' })
  readonly name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: '' })
  readonly description: string;
}
