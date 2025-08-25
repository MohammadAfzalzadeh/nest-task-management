import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoleEntity } from '../auth.entity';

export class ChangeRole {
  @IsNotEmpty()
  @IsUUID()
  @ApiProperty({
    example: 'mohammad',
    description: 'username need changes active or not active',
    required: true,
  })
  username: string;

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
