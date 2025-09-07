import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  Patch,
  Param,
  ForbiddenException,
  Put,
  Delete,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response as Res, Request as Req } from 'express';
import { Accessibility, TaskShareEntity } from './task-share.entity';
import { TaskService } from './task.service';
import { AddItemDto, ShareWithDto } from './dto/add-item.dto';
import { AuthGuard } from '../auth/auth.guard';
import { UpdateItemDto } from './dto/update-item.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { AddReportDto } from './dto/add-report.dto';
import { AddSubItemDto } from './dto/add_sub_item.dto';
import { error } from 'console';
import { ShareItemDto } from './dto/share_item.tdo';

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

    return this.taskService.createTask(dto, username);
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
    /*
    if (dto.shareWith && dto.shareWith.length > 0)
      await this.taskService.updateTaskShare(itemId, dto.shareWith);
    */
    return task;
  }

  @UseGuards(AuthGuard)
  @Get('/item')
  getItems(@Request() req: Req) {
    const username = req['user'].username;
    return this.taskService.getTasks(username);
  }

  @UseGuards(AuthGuard)
  @Get('/search:query')
  search(@Request() req: Req,@Param('query') query: string) {
    const username = req['user'].username;
    return this.taskService.searchTask(query, username);
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
    const task = await this.taskService.addSubTask(dto, username);
    return task;
  }


  @UseGuards(AuthGuard)
  @Post('/comment:itemId')
  async addComment(
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
    const task = await this.taskService.addTaskReport(itemId, username, dto, false);
    return task;
  }

  @UseGuards(AuthGuard)
  @Put('/comment:itemId')
  async updateComment(
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
    const task = await this.taskService.updateTaskReport(itemId, username, dto, false);
    return task;
  }

  @UseGuards(AuthGuard)
  @Delete('/item:itemId')
  async deltetItem(
    @Request() req: Req,
    @Param('itemId') itemId: string,
  ) {
    const username = req['user'].username;
    try {
      const access = await this.taskService.isUserModifyAccess(username, itemId);
      if (access.accessibility !== Accessibility.Owner )
        throw new error()
    } catch {
      throw new ForbiddenException(
        'resource not found or you can not chnage it.',
      );
    }
    await this.taskService.delete(itemId);
  }

  @UseGuards(AuthGuard)
  @Post('/share:itemId')
  async share (
    @Request() req: Req,
    @Body() dto: ShareItemDto,
    @Param('itemId') itemId: string,
  ){
    const username = req['user'].username;
    this.taskService.share(dto.shareWith , itemId);
  }


  @UseGuards(AuthGuard)
  @Get('pending/')
  async getPendingShares(@Request() req: Req): Promise<TaskShareEntity[]> {
    const username = req['user'].username;
    return this.taskService.getPendingShares(username);
  }

  @UseGuards(AuthGuard)
  @Post('accept')
  async acceptShare(
    @Request() req: Req , 
    @Body() body: { taskId: string },
  ): Promise<{ message: string }> {
    const username = req['user'].username;
    await this.taskService.acceptShare(username, body.taskId);
    return { message: 'Task and its children accepted successfully' };
  }
}
