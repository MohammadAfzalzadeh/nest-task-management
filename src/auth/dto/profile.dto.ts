import {
  IsDate,
  IsEmail,
  IsOptional, 
  IsString,
  MaxDate,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';



export class ProfileDto{
  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'mohammad', description: 'first name' , required: false })
  firstName?:string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'afzal', description: 'last name' , required: false })
  lastName?:string;

  @IsOptional()
  @IsEmail()
  @ApiProperty({ example: 'mohammad@gmail.com', description: 'email' , required: false })
  email?:string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'data engineer', description: 'job' , required: false })
  job?:string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'bio...', description: 'bio' , required: false })
  bio?:string;

  @IsOptional()
  @Transform(({ value }) => new Date(value), { toClassOnly: true })
  @IsDate()
  @MaxDate(new Date('2007-10'))
  @ApiProperty({ example: '2001-10-13', description: 'birthday' , required: false })
  birthday?:Date;
}