import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum UpdateAccessibility {
  Owner = 'owner',
  Admin = 'admin',
  Observer = 'observer',
  Delete = 'none',
}

export class UpdateShareWithDto {
  @ApiProperty({ example: 'ali' })
  @IsString()
  username: string;

  @ApiProperty({ enum: UpdateAccessibility, example: 'owner' })
  @IsEnum(UpdateAccessibility)
  accessibility: UpdateAccessibility;
}

export class ShareItemDto{
    @ApiProperty({
    type: [UpdateShareWithDto],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateShareWithDto)
    shareWith: UpdateShareWithDto[];
}