import {
  IsEnum,
  IsNotEmpty, IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoleEntity } from '../auth.entity';


export class ChangeRole{
  @IsNotEmpty()
  @IsUUID()
  @ApiProperty({ example: '561badb8-b8e0-40b5-b607-28456830733b', description: 'id for user need changes active or not active' , required: true })
  userId:string;


  @IsNotEmpty()
  @IsEnum(RoleEntity)
  @ApiProperty({
    example: RoleEntity.admin,
    enum: RoleEntity,
    description: 'Role to assign to the user',
    required: true,
  })
  role: RoleEntity;

}

