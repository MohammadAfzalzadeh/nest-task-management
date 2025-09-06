import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TaskShareEntity } from '../task/task-share.entity';
import { TaskEntity } from 'src/task/task.entity';

export enum MeetStatus {
  Pending = 'Pending',
  OnCall = 'On Call',
  Succeed = 'Succeed',
  Canceld = 'Canceld',
}

export enum MeetType {
  Online = 'Online',
  InPerson = 'In-person',
}

export class MeetDescription {
  time: string;
  by: string;
  text: string;
}

@Entity()
export class MeetEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: MeetType })
  type: MeetType;

  @Column()
  title: string;

  @Column()
  reason: string;

  @Column()
  startTime: string;

  @Column()
  endTime: string;

  @Column()
  creator: string;

  @Column({ type: 'enum', enum: MeetStatus })
  status: MeetStatus;

  @Column({ nullable: true })
  meetLink?: string;

  @Column({ nullable: true })
  place?: string;

  @Column('jsonb', { nullable: true })
  description?: MeetDescription;

  @Column('jsonb', { select: false, default: [] })
  descriptionHistory: MeetDescription[];

  @Column('jsonb', { default: [] })
  attenders: string[];

  @ManyToOne(() => TaskEntity, (task) => task.meets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'TaskId' })
  task: TaskEntity;
}
