import {
  IsBoolean,
  IsNotEmpty, IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class ActiveUserDto{
  @IsNotEmpty()
  @IsUUID()
  userId:string;

  @IsNotEmpty()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  setActive:boolean

}

