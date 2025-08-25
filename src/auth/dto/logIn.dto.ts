import { IsNotEmpty, IsStrongPassword } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogInDto {
  @IsNotEmpty()
  @ApiProperty({
    example: 'mohammad',
    description: 'username or email',
    required: true,
  })
  username: string; // this can be username or email

  @IsNotEmpty()
  @IsStrongPassword()
  @ApiProperty({
    example: '1qaz!QAZ',
    description: 'password for user',
    required: true,
  })
  password: string;
}
