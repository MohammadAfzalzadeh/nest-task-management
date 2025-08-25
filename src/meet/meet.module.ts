import { Module } from '@nestjs/common';
import { MeetService } from './meet.service';
import { MeetController } from './meet.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetEntity } from './meet.entity';
import { TaskEntity } from 'src/task/task.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forFeature([MeetEntity, TaskEntity]),
  ],
  providers: [MeetService],
  controllers: [MeetController],
})
export class MeetModule {}
