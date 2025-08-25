import { IsBoolean, IsNotEmpty, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ActiveUserDto {
  @IsNotEmpty()
  @ApiProperty({
    example: 'mohammad',
    description: 'username need changes active or not active',
    required: true,
  })
  username: string;

  @IsNotEmpty()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @ApiProperty({
    example: true,
    description: 'boolean that show is user set to active or not active',
    required: true,
  })
  setActive: boolean;
}
