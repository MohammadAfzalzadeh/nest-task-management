import {
  IsEmail,
  IsNotEmpty,
  IsStrongPassword, 
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto{
  @IsNotEmpty()
  @ApiProperty({ example: 'mohammad', description: 'the unique username' , required: true })
  username:string;

  @IsNotEmpty()
  @IsStrongPassword()
  @ApiProperty({ example: '1qaz!QAZ', description: 'strong password' , required: true })
  password:string;

  @IsNotEmpty()
  @IsStrongPassword()
  @ApiProperty({ example: '1qaz!QAZ', description: 'repeat the password' , required: true })
  repeatPassword:string;

  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({ example: 'mohamamd@gmail.com', description: 'a valid gmail' , required: true })
  email:string;
}
