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
import { Accessibility } from '../task-share.entity'
import { Type } from 'class-transformer';



export class ShareWithDto {
  @ApiProperty({ example: 'ali' })
  @IsString()
  username: string;

  @ApiProperty({ enum: Accessibility, example: 'viewer' })
  @IsEnum(Accessibility)
  accessibility: Accessibility;
}

export class AddItemDto {
  @ApiProperty({ enum: ItemType, example: 'Task' })
  @IsEnum(ItemType)
  itemType: ItemType;

  @ApiProperty({ example: 'Design database schema' })
  @IsString()
  itemTitle: string;

  @ApiProperty({ format: 'date-time', example: '2025-08-15 17:00:00' })
  @IsDateString()
  deadline: string;

  @ApiProperty({ enum: Status, example: 'Backlog' })
  @IsEnum(Status)
  status: Status;

  @ApiProperty({ enum: Priority, example: 'High' })
  @IsEnum(Priority)
  priority: Priority;

  @ApiProperty({ example: 'backend' })
  @IsString()
  category: string;

  @ApiProperty({
    type: [ShareWithDto],
    required: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShareWithDto)
  shareWith: ShareWithDto[];

  @ApiProperty({
    type: [String],
    example: ['Q3-backlog', 'tech-debt', 'feature-requests'],
  })
  @IsArray()
  @IsString({ each: true })
  backlog: string[];
}
