import {
  Body,
  Controller,
  Get,
  Post,
  Response,
  Request,
  UnauthorizedException,
  UseGuards, Patch,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signUp.dto';
import { LogInDto } from './dto/logIn.dto';
import { Response as Res, Request as Req } from 'express';
import { AuthGuard } from './auth.guard';
import { env } from 'node:process';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { ActiveUserDto } from './dto/activeUser.dto';
import { NotFoundError } from 'rxjs';
import { AuthEntity, RoleEntity } from './auth.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService:AuthService) {}

  @Post('/signUp')
  signUp(@Body() signUpDto:SignUpDto): Promise<AuthEntity[]>{
    if(signUpDto.password != signUpDto.repeatPassword){
      throw new BadRequestException('password and repeatPassword must be matches.')
    }
    return this.authService.signUp(signUpDto)
  }

  @Post('/logIn')
  async logIn(@Body() logInDto: LogInDto , @Response() res:Res) {
    const token = await this.authService.logIn(logInDto)

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production', // HTTPS only in prod
      sameSite: 'lax',
      maxAge: 1000 * 360, // 1 hour
    });

    return res.status(200).json({
      message: 'Login successful',
    });

  }

  @UseGuards(AuthGuard)
  @Get('/user')
  async getProfile(@Request() req:Req){
    const user = await this.authService.getProfile(req['user'].sub)
    if (! user)
      throw new UnauthorizedException('Invalid Token. Need to login again.!');
    return user
  }

  @UseGuards(AuthGuard , RolesGuard)
  @Roles(RoleEntity.admin)
  @Patch('/active')
  async activeUser(@Body() activeUserDto:ActiveUserDto){
    const data
      = await this.authService.activeUser(activeUserDto)
    return {
      message: 'Change user active successful.',
      data
    }
  }

  @UseGuards(AuthGuard , RolesGuard)
  @Roles(RoleEntity.admin)
  @Get('/users')
  async getAllUsers():Promise<AuthEntity[]>{
    return this.authService.getAllUsers()
  }

  @UseGuards(AuthGuard , RolesGuard)
  @Roles(RoleEntity.admin)
  @Get('/user')
  async signOut(){}

  @UseGuards(AuthGuard , RolesGuard)
  @Roles(RoleEntity.admin)
  @Patch('/user')
  async changeRole(){}
}
