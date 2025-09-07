import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsStrongPassword } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsStrongPassword()
  @ApiProperty({
    example: '1qaz!QAZ',
    description: 'strong new password',
    required: true,
  })
  newPassword: string;

  @IsNotEmpty()
  @IsStrongPassword()
  @ApiProperty({
    example: '1qaz!QAZ',
    description: 'repeat the password',
    required: true,
  })
  confirmPassword: string;
}
