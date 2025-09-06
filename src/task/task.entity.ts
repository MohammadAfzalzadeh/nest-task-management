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
    id: string,
    createDate: string,
    isEdited:boolean,
    history?: string[]
  ) {
    this.text = text;
    this.id = id;
    this.userCreator = username;
    this.createDate = createDate;
    this.lastModifyDate = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    this.isEdited = isEdited;
    this.history = history || [];
  }

  static addReport(text:string, creator:string){
    const id = uuidv4();
    const createDate = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    return new TaskReport(text, creator, id, createDate, false)
  }

  static update(prvReport:TaskReport , newReportText:string){
    prvReport.history.push(prvReport.text);
    return new TaskReport(newReportText, prvReport.userCreator, prvReport.id, prvReport.createDate, true, prvReport.history)
  }

  id: string;
  text: string;
  userCreator: string;
  createDate: string;
  lastModifyDate: string;
  history: string[];
  isEdited: boolean;
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

  @Column('text', { array: true })
  assignes:string[];

  @OneToMany(() => TaskShareEntity, (share) => share.task, { cascade: true })
  sharedWith: TaskShareEntity[];

  @Column('jsonb', { nullable: true })
  reportList?: TaskReport[];

  @Column('jsonb', { nullable: true })
  CommentList?: TaskReport[];

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
  
  @Column()
  creator: string;

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
