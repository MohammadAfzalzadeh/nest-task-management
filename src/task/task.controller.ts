import {
  Body,
  Controller,
  Get,
  Post,
  Response,
  Request,
  UnauthorizedException,
  UseGuards,
  Patch,
  BadRequestException,
  Param,
  UseInterceptors,
  UploadedFile,
  MaxFileSizeValidator,
  ParseFilePipe,
  FileTypeValidator,
  NotFoundException,
  ForbiddenException,
  Put,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response as Res, Request as Req } from 'express';
import { Accessibility } from './task-share.entity';
import { TaskService } from './task.service';
import { AddItemDto, ShareWithDto } from './dto/add-item.dto';
import { AuthGuard } from '../auth/auth.guard';
import { UpdateItemDto } from './dto/update-item.dto';
import { format } from 'date-fns';
import { UpdateReportDto } from './dto/update-report.dto';
import { AddReportDto } from './dto/add-report.dto';
import { AddSubItemDto } from './dto/add_sub_item.dto';

@Controller('task')
export class TaskController {
  constructor(
    private taskService: TaskService,
    private configService: ConfigService,
  ) {}

  @UseGuards(AuthGuard)
  @Post('/item')
  addItem(@Request() req: Req, @Body() dto: AddItemDto) {
    const username = req['user'].username;
    const alreadySharedWithMe = dto.shareWith.some(
      (share) => share.username === username,
    );

    if (!alreadySharedWithMe) {
      const shareMe = new ShareWithDto();
      shareMe.username = username;
      shareMe.accessibility = Accessibility.Editor;
      dto.shareWith.push(shareMe);
    }

    return this.taskService.createTask(dto);
  }

  @UseGuards(AuthGuard)
  @Patch('/item:itemId')
  async updateItem(
    @Request() req: Req,
    @Body() dto: UpdateItemDto,
    @Param('itemId') itemId: string,
  ) {
    const username = req['user'].username;
    try {
      await this.taskService.isUserModifyAccess(username, itemId);
    } catch {
      throw new ForbiddenException(
        'resource not found or you can not chnage it.',
      );
    }
    const task = await this.taskService.updateTask(itemId, dto);
    if (dto.shareWith && dto.shareWith.length > 0)
      await this.taskService.updateTaskShare(itemId, dto.shareWith);
    return task;
  }

  @UseGuards(AuthGuard)
  @Get('/item')
  getItems(@Request() req: Req) {
    const username = req['user'].username;
    return this.taskService.getTasks(username);
  }

  @UseGuards(AuthGuard)
  @Get('/item:itemId')
  getItemDetail(@Request() req: Req, @Param('itemId') itemId: string) {
    const username = req['user'].username;
    return this.taskService.getTaskDetail(username, itemId);
  }

  @UseGuards(AuthGuard)
  @Post('/report:itemId')
  async addReport(
    @Request() req: Req,
    @Body() dto: AddReportDto,
    @Param('itemId') itemId: string,
  ) {
    const username = req['user'].username;
    try {
      await this.taskService.isUserModifyAccess(username, itemId);
    } catch {
      throw new ForbiddenException(
        'resource not found or you can not chnage it.',
      );
    }
    const task = await this.taskService.addTaskReport(itemId, username, dto);
    return task;
  }

  @UseGuards(AuthGuard)
  @Put('/report:itemId')
  async updateReport(
    @Request() req: Req,
    @Body() dto: UpdateReportDto,
    @Param('itemId') itemId: string,
  ) {
    const username = req['user'].username;
    try {
      await this.taskService.isUserModifyAccess(username, itemId);
    } catch {
      throw new ForbiddenException(
        'resource not found or you can not chnage it.',
      );
    }
    const task = await this.taskService.updateTaskReport(itemId, username, dto);
    return task;
  }

  @UseGuards(AuthGuard)
  @Post('/subitem')
  async addSubItem(@Request() req: Req, @Body() dto: AddSubItemDto) {
    const username = req['user'].username;
    try {
      await this.taskService.isUserModifyAccess(username, dto.parentItemId);
    } catch {
      throw new ForbiddenException(
        'resource not found or you can not chnage it.',
      );
    }
    const task = await this.taskService.addSubTask(dto);
    return task;
  }
}
