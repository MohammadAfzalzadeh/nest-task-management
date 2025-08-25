import { Column, Entity, PrimaryColumn , OneToMany } from 'typeorm';
import { TaskShareEntity } from '../task/task-share.entity'

export enum RoleEntity{
  user = "user",
  admin = "admin"
}

@Entity()
export class AuthEntity{
  @PrimaryColumn()
  username:string;

  @Column({ select: false })
  password:string;

  @Column({ nullable: true })
  firstName?:string;

  @Column({ unique: true })
  email:string;

  @Column({ nullable: true })
  lastName?:string;

  @Column({ nullable: true })
  birthday?:Date;

  @Column({default:true})
  isActive:boolean;

  @Column({ nullable: true })
  job?:string;

  @Column({ nullable: true })
  bio?:string;

  @Column({default : RoleEntity.user})
  role:RoleEntity;

  @OneToMany(() => TaskShareEntity, (share) => share.user)
  taskShares: TaskShareEntity[];
}


