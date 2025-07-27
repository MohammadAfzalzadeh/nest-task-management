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
  UploadedFile,
  MaxFileSizeValidator,
  ParseFilePipe,
  FileTypeValidator
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

const MAX_FILE_SIZE = parseInt(process.env.FILE_UPLOAD_MAX_SIZE_MB || '10') * 1024 * 1024
@Controller('auth')
export class AuthController {
  private profileImageBasePath;
  constructor(
    private authService:AuthService,
    private configService: ConfigService
  ) {
    this.profileImageBasePath = this.configService.get('PROFILE_IMAGE_BASE_PATH')
  }

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
    const image = createReadStream(path.join(this.profileImageBasePath , userId));
    image.pipe(res);
  }
  
  @UseGuards(AuthGuard)
  @Post('/image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ 
    type: ProfileImageDto
  })
  @UseInterceptors(FileInterceptor('profileImage'))
  async updateProfileImage(
   @Request() req:Req,
   @UploadedFile(
    new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
        new FileTypeValidator({ fileType: /^image\/(jpeg|png|gif|webp|bmp|tiff|svg\+xml)$/ }),
      ],
    }),
  )
  profileImage: Express.Multer.File){
    const userId = req['user'].sub
    await writeFile(path.join(this.profileImageBasePath, userId ) , profileImage.buffer)
    return {message : 'file uploaded succesfully.' }

  }
}
