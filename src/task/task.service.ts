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
  UpdateAssigneeDto,
  UpdateItemDto,
  UpdateShareWithDto,
} from './dto/update-item.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { AddReportDto } from './dto/add-report.dto';
import { AddSubItemDto } from './dto/add_sub_item.dto';

@Injectable()
export class TaskService {
  delete(itemId: string) {
    return this.taskRepo.delete(itemId)
  }
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
/*
    await this.checkUpdateConditions(parentTask, childTask);
*/
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
    isReport:boolean = true
  ) {
    const task = await this.taskRepo.findOneOrFail({
      where: {
        id: itemId,
      },
    });
    if (isReport){
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
    }else {
      const prvComment = task.CommentList?.find(
        (report) => report.id === dto.id && report.userCreator === username,
      );
      if (prvComment) {
        const report = TaskReport.update(prvComment, dto.report)
        task.CommentList =
          task.CommentList?.filter((report) => report.id !== dto.id) || [];
        task.CommentList.push(report);
        return await this.taskRepo.save(task);
      }
      throw new ForbiddenException(
        'comment not found or you have not access to edit it',
      );
    }
  }
  async addTaskReport(itemId: string, username: string, dto: AddReportDto , isReport:boolean = true) {
    const task = await this.taskRepo.findOneOrFail({
      where: {
        id: itemId,
      },
    });
    const report = TaskReport.addReport(dto.report, username);
    if (isReport){
      task.reportList ||= [];
      task.reportList.push(report);
    }else{
      task.CommentList ||= [];
      task.CommentList.push(report)
    }
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
        // accessibility: Accessibility.Editor,
      },
    });
  }

  async updateTask(itemId: string, dto: UpdateItemDto): Promise<TaskEntity> {
    const task = await this.taskRepo.findOneOrFail({
      where: {
        id: itemId,
      },
    });
/*
    if (task.parentTask) {
      await this.checkUpdateConditions(task.parentTask, task);
    }
*/
    task.subTasks = await this.taskRepo.find({ where: { parentTask: task } });
/*
    if (task.subTasks.length > 0) {
      for (const childTask of task.subTasks)
        await this.checkUpdateConditions(task, childTask);
    }
*/
    task.itemType = dto.itemType || task.itemType;
    task.itemTitle = dto.itemTitle || task.itemTitle;
    task.deadline = new Date(dto.deadline || task.deadline.toString());
    task.status = dto.status || task.status;
    task.priority = dto.priority || task.priority;
    task.category = dto.category || task.category;
    task.backlog = dto.backlog || task.backlog;
    task.note = dto.note || task.note;
    const response =  await this.taskRepo.save(task);
    await this.updateAssignUsers(itemId, dto.assignees || []);
    return response;
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
      shareMe.accessibility = Accessibility.Owner;
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
    const task = await this.taskRepo
      .createQueryBuilder('parent')
      .leftJoinAndSelect('parent.subTasks', 'child')
      .innerJoin('parent.sharedWith', 'share')
      .where('share.username = :username', { username })
      .andWhere('parent.id = :taskId', { taskId })
      .getOneOrFail();

      const childTask = await this.shareRepo
      .createQueryBuilder('share')
      .innerJoin('share.task', 'task')
      .where('share.username = :username', { username })
      .andWhere('task.parentTaskId = :parentTaskId', { parentTaskId: task.id })
      .select([
        'task.id',
        'task.itemType',
        'task.itemTitle',
        'task.category',
        'task.priority',
        'task.status',
      ]).getRawMany();
    
    const isOwner = await this.shareRepo.findOne({where:{task:{id:task.id} , user:{username} , accessibility:Accessibility.Owner}})
    let reportList:any[] = task.reportList || []
    let CommentList:any[] = task.CommentList || []
    if (!isOwner){
      reportList = reportList.map(r => ({id:r.id , text:r.text , creator:r.userCreator , createDate:r.createDate , isedited:r.isEdited , lastModifyDate:r.lastModifyDate }))
      CommentList = CommentList.map(r => ({id:r.id , text:r.text , creator:r.userCreator , createDate:r.createDate , isedited:r.isEdited , lastModifyDate:r.lastModifyDate }))
    }
    return {
      ...task,
      children: childTask,
      reportList,
      CommentList
    }
  }

  private async updateAssignUsers(taskId:string , users:UpdateAssigneeDto[]){
    const assign:string[] = [];
    const unassign:string[] = [];

    users.forEach(u => {
      if (u.addAssignee)
        assign.push(u.username);
      else 
        unassign.push(u.username);
    })

    await this.assignUsers(taskId , assign);
    await this.unassignUsers(taskId, unassign);
  }
   /**
   * Assign users to a task and all its children
   */
   private async assignUsers(taskId: string, users: string[]): Promise<TaskEntity> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['subTasks'],
    });
    if (!task) throw new NotFoundException('Task not found');

    // merge existing + new users (remove duplicates)
    task.assignes = Array.from(new Set([...(task.assignes || []), ...users]));

    await this.taskRepo.save(task);

    // recursively assign to children
    await this.updateChildAssignes(task.subTasks, task.assignes);

    return task;
  }

  /**
   * Unassign users from a task and all its children
   */
  private async unassignUsers(taskId: string, users: string[]): Promise<TaskEntity> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['subTasks'],
    });
    if (!task) throw new NotFoundException('Task not found');

    // filter out the users
    task.assignes = (task.assignes || []).filter(
      (user) => !users.includes(user),
    );

    await this.taskRepo.save(task);

    // recursively unassign from children
    await this.updateChildAssignes(task.subTasks, task.assignes);

    return task;
  }

  /**
   * Recursive helper for updating child assignes
   */
  private async updateChildAssignes(
    children: TaskEntity[],
    parentAssignes: string[],
  ) {
    if (!children || children.length === 0) return;

    for (const child of children) {
      // load full entity including its own subTasks
      const childTask = await this.taskRepo.findOne({
        where: { id: child.id },
        relations: ['subTasks'],
      });

      if (!childTask) continue;

      // overwrite child assignes with parent assignes
      childTask.assignes = [...parentAssignes];
      await this.taskRepo.save(childTask);

      // recursive call for deeper levels
      await this.updateChildAssignes(childTask.subTasks, parentAssignes);
    }
  }
/*
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
*/
}
