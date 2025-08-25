import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MeetType, MeetAttender } from '../meet.entity';

export class AttenderDto implements MeetAttender {
  @IsString()
  username: string;

  @IsString()
  email: string;
}

export class CreateMeetDto {
  @IsEnum(MeetType)
  type: MeetType;

  @IsString()
  title: string;

  @IsString()
  reason: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttenderDto)
  attenders: AttenderDto[];

  @IsOptional()
  @IsString()
  place?: string;
}
