import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MeetStatus, MeetDescription } from '../meet.entity';

export class DescriptionDto implements MeetDescription {
  @IsString()
  time: string;

  @IsString()
  by: string;

  @IsString()
  text: string;
}

export class UpdateMeetDto {
  @IsOptional()
  @IsEnum(MeetStatus)
  status?: MeetStatus;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DescriptionDto)
  description?: DescriptionDto;
}
