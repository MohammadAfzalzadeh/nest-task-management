import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum RoleEntity{
  user = "user",
  admin = "admin"
}

@Entity()
export class AuthEntity{
  @PrimaryGeneratedColumn('uuid')
  id:string;

  @Column()
  username:string;

  @Column({ select: false })
  password:string;

  @Column({ nullable: true })
  firstName?:string;

  @Column()
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
}


