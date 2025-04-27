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

  @Column()
  name?:string;

  @Column()
  email:string;

  @Column()
  phoneNumber:string;

  @Column()
  birthday?:Date;

  @Column({default:true})
  isActive:boolean;

  @Column({default : RoleEntity.user})
  role:RoleEntity;
}


