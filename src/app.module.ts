import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { env } from 'node:process';



@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath:'.env' ,
      isGlobal:true
    }) ,
    AuthModule ,
    TypeOrmModule.forRoot({
    type: 'postgres',
    host: env.DATABSE_HOST,
    port: 5432,
    username: env.DATABSE_USERNAME,
    password: env.DATABSE_PASSWOED,
    database: env.DATABSE_NAME,
    autoLoadEntities: true,
    synchronize: true,
  }),],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
