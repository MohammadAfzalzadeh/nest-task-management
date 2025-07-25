import {
  IsBoolean,
  IsNotEmpty, IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';


export class ActiveUserDto{
  @IsNotEmpty()
  @IsUUID()
  @ApiProperty({ example: '561badb8-b8e0-40b5-b607-28456830733b', description: 'id for user need changes active or not active' , required: true })
  userId:string;

  @IsNotEmpty()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @ApiProperty({ example: true, description: 'boolean that show is user set to active or not active' , required: true })
  setActive:boolean

}

