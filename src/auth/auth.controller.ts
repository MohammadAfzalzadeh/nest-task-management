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
  Param,
  UseInterceptors,
  UploadedFile
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signUp.dto';
import { LogInDto } from './dto/logIn.dto';
import { ProfileImageDto } from './dto/image.dto'
import { writeFile } from 'fs/promises';
import { createReadStream } from 'fs'
import { Response as Res, Request as Req } from 'express';
import { AuthGuard } from './auth.guard';
import { env } from 'node:process';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { ActiveUserDto } from './dto/activeUser.dto';
import { ChangeRole } from './dto/changeRole.dto'
import { AuthEntity, RoleEntity } from './auth.entity';
import { ProfileDto } from './dto/profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as path from 'node:path';
import * as mime from 'mime-types'; 

@Controller('auth')
export class AuthController {
  constructor(
    private authService:AuthService,
    private configService: ConfigService
  ) {}

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
  @Get('/profile')
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
  @Patch('/role')
  async changeRole(@Body() changeRole:ChangeRole){}

  @UseGuards(AuthGuard)
  @Patch('/profile')
  async changeProfile(@Request() req:Req, @Body() profileDto:ProfileDto){
    const userId = req['user'].sub
    return this.authService.changeProfile(userId , profileDto)
  }

  @Get('/image/:userId')
  getProfileImage(@Param('userId') userId:string , @Response() res:Res){
    const profileImageBasePath = this.configService.get('PROFILE_IMAGE_BASE_PATH')
    const image = createReadStream(path.join(profileImageBasePath , userId));
    image.pipe(res);
  }
  
  @UseGuards(AuthGuard)
  @Post('/image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ 
    type: ProfileImageDto
  })
  @UseInterceptors(FileInterceptor('profileImage'))
  async updateProfileImage(@Request() req:Req, @UploadedFile() profileImage: Express.Multer.File){
    const userId = req['user'].sub
    const profileImageBasePath = this.configService.get('PROFILE_IMAGE_BASE_PATH')
    await writeFile(path.join(profileImageBasePath, userId ) , profileImage.buffer)
    return {message : 'file uploaded succesfully.' }

  }
}
