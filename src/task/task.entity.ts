import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

import { TaskShareEntity } from './task-share.entity';
import { MeetEntity } from 'src/meet/meet.entity';

export enum ItemType {
  Task = 'Task',
  Project = 'Project',
  Portfolio = 'Portfolio',
  Other = 'Other',
}

export enum Status {
  Backlog = 'Backlog',
  InProgress = 'In Progres',
  Done = 'Done',
}

export enum Priority {
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
}

export class TaskReport {
  constructor(
    text: string,
    username: string,
    id?: string,
    createDate?: string,
  ) {
    this.text = text;
    this.id = id || uuidv4();
    this.userCreator = username;
    this.createDate = createDate || format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    this.lastModifyDate = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  }

  id: string;
  text: string;
  userCreator: string;
  createDate: string;
  lastModifyDate: string;
}

@Entity()
export class TaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  itemType: ItemType;

  @Column()
  itemTitle: string;

  @Column({ type: 'timestamp' })
  deadline: Date;

  @Column()
  status: Status;

  @Column()
  priority: Priority;

  @Column()
  category: string;

  @Column('text', { array: true, nullable: true })
  backlog: string[];

  @Column({ nullable: true })
  note?: string;

  @OneToMany(() => TaskShareEntity, (share) => share.task, { cascade: true })
  sharedWith: TaskShareEntity[];

  @Column('jsonb', { nullable: true })
  reportList?: TaskReport[];

  @ManyToOne(() => TaskEntity, (task) => task.subTasks, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parentTaskId' })
  parentTask?: TaskEntity;

  @OneToMany(() => TaskEntity, (task) => task.parentTask, { cascade: true })
  subTasks: TaskEntity[];

  @OneToMany(() => MeetEntity, (meet) => meet.task)
  meets: MeetEntity[];

  static subtaskToJson(subTasks: TaskEntity) {
    return {
      id: subTasks.id,
      itemType: subTasks.itemType,
      itemTitle: subTasks.itemTitle,
      category: subTasks.category,
      priority: subTasks.priority,
      status: subTasks.status,
    };
  }
  toJSON() {
    return {
      id: this.id,
      itemType: this.itemType,
      itemTitle: this.itemTitle,
      deadline: format(this.deadline, 'yyyy-MM-dd HH:mm:ss'),
      status: this.status,
      priority: this.priority,
      category: this.category,
      backlog: this.backlog,
      sharedWith: this.sharedWith?.map((share) => ({
        username: share.user.username,
        accessibility: share.accessibility,
      })),
      report:
        this.reportList?.sort(
          (a, b) =>
            new Date(a.createDate).getTime() - new Date(b.createDate).getTime(),
        ) || [],
      note: this.note || '',
      subTasks: this.subTasks?.map((subTasks) =>
        TaskEntity.subtaskToJson(subTasks),
      ),
    };
  }
}
