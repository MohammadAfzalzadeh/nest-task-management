import { Module } from '@nestjs/common';
import { MeetService } from './meet.service';
import { MeetController } from './meet.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetEntity } from './meet.entity';
import { TaskEntity } from 'src/task/task.entity';
import { TaskShareEntity } from 'src/task/task-share.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forFeature([MeetEntity, TaskEntity, TaskShareEntity]),
    AuthModule
  ],
  providers: [MeetService],
  controllers: [MeetController],
})
export class MeetModule {}
