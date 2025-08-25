import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ItemType, Status, Priority } from '../task.entity'
import { Type } from 'class-transformer';

export enum UpdateAccessibility {
  Viewer = 'viewer',
  Editor = 'editor',
  Delete = 'none'
}

export class UpdateShareWithDto {
  @ApiProperty({ example: 'ali' })
  @IsString()
  username: string;

  @ApiProperty({ enum: UpdateAccessibility, example: 'viewer' })
  @IsEnum(UpdateAccessibility)
  accessibility: UpdateAccessibility;
}

export class UpdateItemDto {
  @ApiProperty({ enum: ItemType, example: 'Task' })
  @IsOptional()
  @IsEnum(ItemType)
  itemType?: ItemType;

  @ApiProperty({ example: 'Design database schema' })
  @IsOptional()
  @IsString()
  itemTitle?: string;

  @ApiProperty({ format: 'date-time', example: '2025-08-15 17:00:00' })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiProperty({ enum: Status, example: 'Backlog' })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiProperty({ enum: Priority, example: 'High' })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiProperty({ example: 'backend' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    type: [String],
    example: ['Q3-backlog', 'tech-debt', 'feature-requests'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  backlog?: string[];

  @ApiProperty({
    type: [UpdateShareWithDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateShareWithDto)
  shareWith?: UpdateShareWithDto[];

  @ApiProperty({ example: 'test note...' })
  @IsOptional()
  @IsString()
  note?: string;  
}
