import { ApiProperty } from '@nestjs/swagger';
import {  IsNotEmpty, IsString } from 'class-validator';

export class AddReportDto {
  @ApiProperty({ example: 'some report for now ...' })
  @IsNotEmpty()
  @IsString()
  report: string;
}
