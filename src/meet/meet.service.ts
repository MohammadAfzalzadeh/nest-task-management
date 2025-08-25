import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, Repository } from 'typeorm';
import { MeetEntity, MeetStatus } from './meet.entity';
import { TaskEntity } from 'src/task/task.entity';
import { CreateMeetDto } from './dto/create-meet.dto';
import { UpdateMeetDto } from './dto/update-meet.dto';
import { Accessibility, TaskShareEntity } from 'src/task/task-share.entity';

@Injectable()
export class MeetService {
  constructor(
    @InjectRepository(MeetEntity)
    private meetRepo: Repository<MeetEntity>,
    @InjectRepository(TaskEntity)
    private taskRepo: Repository<TaskEntity>,
    @InjectRepository(TaskShareEntity)
    private shareRepo: Repository<TaskShareEntity>,
  ) {}
  private async checkUserAccess(username, taskId) {
    try {
      return (
        (
          await this.shareRepo.findOneOrFail({
            where: { user: { username }, task: { id: taskId } },
            select: { accessibility: true },
          })
        ).accessibility === Accessibility.Editor
      );
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        throw new ForbiddenException(
          'task not found or you have not access to create meet for it.',
        );
      }
      throw e;
    }
  }
  async createMeet(taskId: string, dto: CreateMeetDto, creator: string) {
    const isOwner = await this.checkUserAccess(creator, taskId);

    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    const meet = this.meetRepo.create({
      ...dto,
      status: MeetStatus.Pending,
      creator,
      task,
    });

    await this.meetRepo.save(meet);

    if (isOwner) {
      return {
        ...meet,
        descriptionHistory: meet.descriptionHistory,
      };
    }
    return meet;
  }

  async getTaskMeets(taskId: string) {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['meets'],
    });
    if (!task) throw new NotFoundException('Task not found');

    return task.meets.map((meet) => ({
      id: meet.id,
      title: meet.title,
      creator: meet.creator,
      status: meet.status,
    }));
  }

  async getMeetDetail(meetId: string, username: string) {
    const isOwner = await this.checkUserAccess(username, taskId);
    let meetQueryBuilder = this.meetRepo.createQueryBuilder('meet');
    if (isOwner)
      meetQueryBuilder = meetQueryBuilder.addSelect('meet.descriptionHistory');
    const meet = await meetQueryBuilder
      .where('meet.id = :id', { id: meetId })
      .getOne();

    if (!meet) throw new NotFoundException('Meet not found');
    return meet;
  }

  async updateMeet(meetId: string, dto: UpdateMeetDto, username: string) {
    const isOwner = await this.checkUserAccess(username, taskId);
    const meet = await this.meetRepo.findOne({ where: { id: meetId } });
    if (!meet) throw new NotFoundException('Meet not found');

    if (dto.status) meet.status = dto.status;
    if (dto.startTime) meet.startTime = dto.startTime;
    if (dto.endTime) meet.endTime = dto.endTime;

    if (dto.description) {
      if (meet.description) {
        meet.descriptionHistory.push(meet.description);
      }
      meet.description = dto.description;
    }

    await this.meetRepo.save(meet);

    if (isOwner) {
      return {
        ...meet,
        descriptionHistory: meet.descriptionHistory,
      };
    }
    return meet;
  }
}
