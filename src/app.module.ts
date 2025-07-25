import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule , ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath:'.env' ,
      isGlobal:true
    }) ,
    AuthModule ,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get("DATABSE_HOST"),
        port: parseInt(config.get('DATABSE_PORT', '5432')),
        username: config.get("DATABSE_USERNAME"),
        password: config.get("DATABSE_PASSWOED"),
        database: config.get("DATABSE_NAME"),
        autoLoadEntities: true,
        synchronize: true,
      })
  }),],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
