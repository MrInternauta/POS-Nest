import { ApiProperty } from '@nestjs/swagger';

import { IsString, Length } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @ApiProperty()
  readonly currentPassword: string;

  //bcrypt reads only the first 72 bytes
  @IsString()
  @Length(8, 72)
  @ApiProperty({ description: '8 characters or more' })
  readonly newPassword: string;
}
