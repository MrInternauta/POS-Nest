import { ApiProperty } from '@nestjs/swagger';

import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class UserDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'A simple name for the customer' })
  readonly name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly lastName: string;

  @IsPhoneNumber()
  @IsNotEmpty()
  @ApiProperty()
  readonly phone: string;

  @IsString()
  @IsEmail()
  @ApiProperty({ description: 'A simple name for the user' })
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly password: string;

  @IsNotEmpty()
  @ApiProperty()
  @IsOptional()
  readonly role?: string;
}
