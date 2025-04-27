import {
  IsNotEmpty,
  IsStrongPassword,
} from 'class-validator';

export class LogInDto{
  @IsNotEmpty()
  username:string; // this can be username or phone number or email

  @IsNotEmpty()
  @IsStrongPassword()
  password:string;

}

