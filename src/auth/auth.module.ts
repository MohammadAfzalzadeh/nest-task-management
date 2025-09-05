import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { VerificationCodeService } from './verificationCode.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthEntity } from './auth.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TaskShareEntity } from '../task/task-share.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forFeature([AuthEntity, TaskShareEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule], // make sure ConfigService is available here
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') },
      }),
    }),
  ],
  providers: [AuthService, VerificationCodeService],
  controllers: [AuthController],
  exports: [JwtModule],
})
export class AuthModule {}
