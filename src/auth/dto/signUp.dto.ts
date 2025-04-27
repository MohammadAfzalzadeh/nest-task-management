import {
  IsDate,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsNumberString,
  IsOptional, IsString,
  IsStrongPassword, Matches, MaxDate,
  MinDate,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class SignUpDto{
  @IsNotEmpty()
  username:string;

  @IsNotEmpty()
  @IsStrongPassword()
  password:string;

  @IsNotEmpty()
  @IsStrongPassword()
  repeatPassword:string;

  @IsOptional()
  name?:string;

  @IsNotEmpty()
  @IsEmail()
  email:string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^09[0-9]{9}/)
  phoneNumber:string;

  @IsOptional()
  @Transform(({ value }) => new Date(value), { toClassOnly: true })
  @IsDate()
  @MaxDate(new Date('2007-04'))
  birthday?:Date;
}

/** Test data:
 {
  "username":"mmd" ,
  "password": "1qaz!QAZ",
  "repeatPassword":"1qaz!QAZ",
  "phoneNumber":"09154502521",
  "email":"mmm@chert.pert",
  "birthday":"2001:10:13",
  "name":"mamamd afzal"
 }
 */
