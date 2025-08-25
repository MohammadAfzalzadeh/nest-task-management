import { TaskService } from './task.service';
import { TaskController } from './task.controller'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthEntity } from '../auth/auth.entity';
import { TaskEntity } from './task.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TaskShareEntity } from './task-share.entity'
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forFeature([AuthEntity, TaskEntity, TaskShareEntity]),
    AuthModule
  ],
  providers: [TaskService],
  controllers: [TaskController]
})
export class TaskModule {}

