import { ApiProperty } from '@nestjs/swagger';
import {  IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class UpdateReportDto {
  @ApiProperty({ example: '5319cfcd-f809-4a8b-a077-6a2d30c7ba1c' })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  id: string;

  @ApiProperty({ example: 'some report for now ...' })
  @IsNotEmpty()
  @IsString()
  report: string;
}
