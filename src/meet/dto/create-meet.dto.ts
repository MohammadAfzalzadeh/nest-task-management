import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MeetType } from '../meet.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMeetDto {
  @ApiProperty({
    example: 'In-person',
    description: 'type of meeting(Online/In-person)',
    required: true,
  })
  @IsEnum(MeetType)
  type: MeetType;

  @ApiProperty({
    example: 'test title',
    description: 'meeting title',
    required: true,
  })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'test reason',
    description: 'metting reason',
    required: true,
  })
  @IsString()
  reason: string;

  @ApiProperty({
    example: '2025-08-05 15:00',
    description: 'metting start time',
    required: true,
  })
  @IsString()
  startTime: string;

  @ApiProperty({
    example: '2025-08-05 16:00',
    description: 'meeting end time',
    required: true,
  })
  @IsString()
  endTime: string;

  @ApiProperty({
    example: ['ali' , 'mohammad'],
    description: 'list of attenders',
    required: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @IsString()
  attenders: string[];

  @ApiProperty({
    example: 'test place',
    description: 'use this for inplace meeting',
    required: false,
  })
  @IsOptional()
  @IsString()
  place?: string;
}
