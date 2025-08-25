import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Response as Res, Request as Req } from 'express';

import { MeetService } from './meet.service';
import { CreateMeetDto } from './dto/create-meet.dto';
import { UpdateMeetDto } from './dto/update-meet.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller()
export class MeetController {
  constructor(private readonly meetService: MeetService) {}

  // 1. Create meet for task
  @UseGuards(AuthGuard)
  @Post('meets/:taskId')
  createMeet(
    @Request() req: Req,
    @Param('taskId') taskId: string,
    @Body() dto: CreateMeetDto,
  ) {
    const creator = req['user'].username;
    return this.meetService.createMeet(taskId, dto, creator);
  }

  // 2. Show meets of a task
  @UseGuards(AuthGuard)
  @Get('meets-all/:taskId')
  getTaskMeets(@Request() req: Req, @Param('taskId') taskId: string) {
    return this.meetService.getTaskMeets(taskId);
  }

  // 3. Show meet detail
  @UseGuards(AuthGuard)
  @Get('meets/:id')
  getMeetDetail(@Request() req: Req, @Param('id') id: string) {
    return this.meetService.getMeetDetail(id);
  }

  // 4. Update meet
  @UseGuards(AuthGuard)
  @Patch('meets/:id')
  updateMeet(
    @Request() req: Req,
    @Param('id') id: string,
    @Body() dto: UpdateMeetDto,
  ) {
    return this.meetService.updateMeet(id, dto);
  }
}
