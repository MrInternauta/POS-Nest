import { ApiProperty } from '@nestjs/swagger';

import { IsEmail, IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator';

import { STORE_ROLES, StoreRole } from '../entities/store-member.entity';

/**
 * Someone to add to the store. An email that already has an account just joins, keeping their own
 * password. A new one gets an account with the temporary password the owner picks.
 */
export class AddMemberDto {
  @IsEmail()
  @MaxLength(255)
  @ApiProperty()
  readonly email: string;

  @IsIn(STORE_ROLES)
  @ApiProperty({ enum: STORE_ROLES })
  readonly role: StoreRole;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  @ApiProperty({ required: false, description: 'Needed for a new account' })
  readonly name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiProperty({ required: false })
  readonly lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @ApiProperty({ required: false })
  readonly phone?: string;

  @IsOptional()
  @IsString()
  @Length(8, 72)
  @ApiProperty({ required: false, description: 'Temporary password for a new account, 8 characters or more' })
  readonly password?: string;
}

export class UpdateMemberDto {
  @IsIn(STORE_ROLES)
  @ApiProperty({ enum: STORE_ROLES })
  readonly role: StoreRole;
}
