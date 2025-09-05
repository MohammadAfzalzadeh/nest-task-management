import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TaskEntity, TaskReport, Status, Priority } from './task.entity';
import { Repository } from 'typeorm';
import { AddItemDto, ShareWithDto } from './dto/add-item.dto';
import { Accessibility, TaskShareEntity } from './task-share.entity';
import { AuthEntity } from '../auth/auth.entity';
import {
  UpdateAccessibility,
  UpdateItemDto,
  UpdateShareWithDto,
} from './dto/update-item.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { AddReportDto } from './dto/add-report.dto';
import { AddSubItemDto } from './dto/add_sub_item.dto';

@Injectable()
export class TaskService {
  async addSubTask(dto: AddSubItemDto, username:string) {
    const parentTask = await this.taskRepo.findOneOrFail({
      where: {
        id: dto.parentItemId,
      },
    });
    const childTask = await this.createTask(dto, username);
    parentTask.sharedWith = await this.shareRepo.find({
      where: { task: parentTask },
    });
    await this.checkUpdateConditions(parentTask, childTask);
    childTask.parentTask = parentTask;
    parentTask.subTasks =
      (await this.taskRepo.find({ where: { parentTask: parentTask } })) || [];
    parentTask.subTasks.push(childTask);
    await this.taskRepo.save(childTask);
    return await this.taskRepo.save(parentTask);
  }
  async updateTaskReport(
    itemId: string,
    username: string,
    dto: UpdateReportDto,
  ) {
    const task = await this.taskRepo.findOneOrFail({
      where: {
        id: itemId,
      },
    });
    const prvReport = task.reportList?.find(
      (report) => report.id === dto.id && report.userCreator === username,
    );
    if (prvReport) {
      const report = TaskReport.update(prvReport, dto.report)
      task.reportList =
        task.reportList?.filter((report) => report.id !== dto.id) || [];
      task.reportList.push(report);
      return await this.taskRepo.save(task);
    }
    throw new ForbiddenException(
      'report not found or you have not access to edit it',
    );
  }
  async addTaskReport(itemId: string, username: string, dto: AddReportDto) {
    const task = await this.taskRepo.findOneOrFail({
      where: {
        id: itemId,
      },
    });
    const report = TaskReport.addReport(dto.report, username);
    task.reportList ||= [];
    task.reportList.push(report);
    return await this.taskRepo.save(task);
  }

  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepo: Repository<TaskEntity>,

    @InjectRepository(TaskShareEntity)
    private readonly shareRepo: Repository<TaskShareEntity>,

    @InjectRepository(AuthEntity)
    private readonly userRepo: Repository<AuthEntity>,
  ) {}

  isUserModifyAccess(
    username: string,
    itemId: string,
  ): Promise<TaskShareEntity> {
    return this.shareRepo.findOneOrFail({
      where: {
        task: {
          id: itemId,
        },
        user: {
          username,
        },
        accessibility: Accessibility.Editor,
      },
    });
  }

  async updateTask(itemId: string, dto: UpdateItemDto): Promise<TaskEntity> {
    const task = await this.taskRepo.findOneOrFail({
      where: {
        id: itemId,
      },
    });

    if (task.parentTask) {
      await this.checkUpdateConditions(task.parentTask, task);
    }

    task.subTasks = await this.taskRepo.find({ where: { parentTask: task } });

    if (task.subTasks.length > 0) {
      for (const childTask of task.subTasks)
        await this.checkUpdateConditions(task, childTask);
    }

    task.itemType = dto.itemType || task.itemType;
    task.itemTitle = dto.itemTitle || task.itemTitle;
    task.deadline = new Date(dto.deadline || task.deadline.toString());
    task.status = dto.status || task.status;
    task.priority = dto.priority || task.priority;
    task.category = dto.category || task.category;
    task.backlog = dto.backlog || task.backlog;
    task.note = dto.note || task.note;
    task.assignes = task.assignes || [];
    dto.assignees?.forEach(asssignee=>{
      if(asssignee.addAssignee)
        task.assignes.push(asssignee.username);
      else{
        const index = task.assignes.indexOf(asssignee.username)
        if (index > -1) { 
          task.assignes.splice(index, 1); 
        }
      }
    })

    return await this.taskRepo.save(task);
  }

  async updateTaskShare(itemId: string, sharedWith: UpdateShareWithDto[]) {
    for (const taskShare of sharedWith) {
      const prvTaskShare = await this.shareRepo.findOne({
        where: {
          task: {
            id: itemId,
          },
          user: {
            username: taskShare.username,
          },
        },
      });
      switch (taskShare.accessibility) {
        case UpdateAccessibility.Editor:
        case UpdateAccessibility.Viewer:
          if (prvTaskShare) {
            prvTaskShare.accessibility =
              taskShare.accessibility as unknown as Accessibility;
            this.shareRepo.save(prvTaskShare);
          } else {
            const taskShareEntity = new TaskShareEntity();
            taskShareEntity.task = await this.taskRepo.findOneOrFail({
              where: {
                id: itemId,
              },
            });
            taskShareEntity.user = await this.userRepo.findOneOrFail({
              where: {
                username: taskShare.username,
              },
            });
            taskShareEntity.accessibility =
              taskShare.accessibility as unknown as Accessibility;
            this.shareRepo.save(taskShareEntity);
          }
          break;
        case UpdateAccessibility.Delete:
          if (prvTaskShare) this.shareRepo.delete(prvTaskShare.id);

          break;
      }
    }
  }

  private shareWithMe(dto: AddItemDto, username:string){
    const alreadySharedWithMe = dto.shareWith.some(
      (share) => share.username === username,
    );

    if (!alreadySharedWithMe) {
      const shareMe = new ShareWithDto();
      shareMe.username = username;
      shareMe.accessibility = Accessibility.Editor;
      dto.shareWith.push(shareMe);
    }
  }

  async createTask(dto: AddItemDto, username:string): Promise<TaskEntity> {
    this.shareWithMe(dto, username);

    const task = new TaskEntity();

    task.itemType = dto.itemType;
    task.itemTitle = dto.itemTitle;
    task.deadline = new Date(dto.deadline);
    task.status = dto.status;
    task.priority = dto.priority;
    task.category = dto.category;
    task.backlog = dto.backlog;
    task.assignes = dto.assignes;
    task.creator = username;

    if (dto.shareWith?.length) {
      const shareEntities: TaskShareEntity[] = [];

      for (const shareDto of dto.shareWith) {
        const user = await this.userRepo.findOne({
          where: {
            username: shareDto.username,
          },
        });

        if (!user) {
          throw new NotFoundException(
            `User with username "${shareDto.username}" not found`,
          );
        }

        const share = new TaskShareEntity();
        share.user = user;
        share.accessibility = shareDto.accessibility;
        share.task = task;
        shareEntities.push(share);
      }

      task.sharedWith = shareEntities;
    }

    return await this.taskRepo.save(task);
  }


  async getTasks(username: string) {
    const sharedTask = await this.shareRepo
      .createQueryBuilder('share')
      .innerJoin('share.task', 'task')
      .where('share.username = :username', {
        username,
      })
      .select([
        'task.id',
        'task.itemType',
        'task.itemTitle',
        'task.category',
        'task.priority',
        'task.status',
        'task.parentTaskId'
      ]).getRawMany();

      const sharedIds = new Set(sharedTask.map(t => t.task_id));

      return sharedTask
        .filter(t => t.parentTaskId == null || !sharedIds.has(t.parentTaskId))
        .map(({ parentTaskId, ...rest }) => rest);
      
  }

  async getTaskDetail(username: string, taskId: string) {
    return this.taskRepo
      .createQueryBuilder('parent')
      .leftJoinAndSelect('parent.subTasks', 'child')
      .innerJoin('parent.sharedWith', 'share')
      .where('share.username = :username', { username })
      .andWhere('parent.id = :taskId', { taskId })
      .getOne();
  }

  private checkUpdateConditions(
    parentTask: TaskEntity,
    childTask: TaskEntity,
  ): void {
    const errors: string[] = [];
    const RANKS = {
      status: {
        [Status.Backlog]: 0,
        [Status.InProgress]: 1,
        [Status.Done]: 2,
      },
      priority: {
        [Priority.Low]: 0,
        [Priority.Medium]: 1,
        [Priority.High]: 2,
      },
      accessibility: {
        [Accessibility.Viewer]: 0,
        [Accessibility.Editor]: 1,
      },
    };
    // Validate priority
    if (
      !RANKS.priority[parentTask.priority] ||
      !RANKS.priority[childTask.priority]
    ) {
      errors.push('Invalid priority value for parent or child task.');
    } else if (
      RANKS.priority[parentTask.priority] > RANKS.priority[childTask.priority]
    ) {
      errors.push(
        `Child task priority (${childTask.priority}) cannot be lower than parent task priority (${parentTask.priority}).`,
      );
    }

    // Validate status
    if (!RANKS.status[parentTask.status] || !RANKS.status[childTask.status]) {
      errors.push('Invalid status value for parent or child task.');
    } else if (
      RANKS.status[parentTask.status] > RANKS.status[childTask.status]
    ) {
      errors.push(
        `Child task status (${childTask.status}) cannot precede parent task status (${parentTask.status}).`,
      );
    }

    // Validate deadline
    const parentDeadline = new Date(parentTask.deadline);
    const childDeadline = new Date(childTask.deadline);
    if (isNaN(parentDeadline.getTime()) || isNaN(childDeadline.getTime())) {
      errors.push('Invalid deadline format for parent or child task.');
    } else if (parentDeadline < childDeadline) {
      errors.push(
        `Child task deadline (${childDeadline.toISOString().split('T')[0]}) cannot be after parent task deadline (${
          parentDeadline.toISOString().split('T')[0]
        }).`,
      );
    }

    // Validate shared access
    const badShares: string[] = [];
    for (const childShare of childTask.sharedWith) {
      if (
        !childShare.user?.username ||
        !RANKS.accessibility[childShare.accessibility]
      ) {
        errors.push(
          `Invalid shared user or accessibility for child task: ${JSON.stringify(childShare)}`,
        );
        continue;
      }
      const parentShare = parentTask.sharedWith.find(
        (parentShare) =>
          parentShare.user?.username === childShare.user.username &&
          RANKS.accessibility[parentShare.accessibility] >=
            RANKS.accessibility[childShare.accessibility],
      );
      if (!parentShare) {
        badShares.push(childShare.user.username);
      }
    }
    if (badShares.length > 0) {
      errors.push(
        `The following users have insufficient access to the parent task: ${badShares.join(', ')}. ` +
          `All users shared with the child task must have equal or higher access to the parent task.`,
      );
    }

    // Throw all errors if any exist
    if (errors.length > 0) {
      throw new BadRequestException(
        `Validation failed for child task:\n- ${errors.join('\n- ')}`,
      );
    }
  }
}
