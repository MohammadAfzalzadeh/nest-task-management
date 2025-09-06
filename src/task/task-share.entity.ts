import {
  Entity,
  ManyToOne,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { TaskEntity } from './task.entity';
import { AuthEntity } from '../auth/auth.entity';

export enum Accessibility {
  Owner = 'owner',
  Admin = 'admin',
  Observer = 'observer'
}

@Entity()
export class TaskShareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TaskEntity, (task) => task.sharedWith, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'taskId' })
  task: TaskEntity;

  @ManyToOne(() => AuthEntity, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'username' })
  user: AuthEntity;

  @Column({ type: 'enum', enum: Accessibility })
  accessibility: Accessibility;
}
