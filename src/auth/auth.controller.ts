import {
  Body,
  Controller,
  Get,
  Post,
  Response,
  Request,
  UnauthorizedException,
  UseGuards,
  Patch,
  BadRequestException,
  Param,
  UseInterceptors,
  UploadedFile,
  MaxFileSizeValidator,
  ParseFilePipe,
  FileTypeValidator,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { VerificationCodeService } from './verificationCode.service';
import { SignUpDto } from './dto/signUp.dto';
import { LogInDto } from './dto/logIn.dto';
import { ProfileImageDto } from './dto/image.dto';
import { writeFile } from 'fs/promises';
import { createReadStream, existsSync } from 'fs';
import { Response as Res, Request as Req } from 'express';
import { AuthGuard } from './auth.guard';
import { env } from 'node:process';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { ActiveUserDto } from './dto/activeUser.dto';
import { ChangeRole } from './dto/changeRole.dto';
import { AuthEntity, RoleEntity } from './auth.entity';
import { ProfileDto } from './dto/profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ApiProduces, ApiOkResponse } from '@nestjs/swagger';
import * as path from 'node:path';
import { ChangePasswordDto } from './dto/changePassword.dto';

const MAX_FILE_SIZE =
  parseInt(process.env.FILE_UPLOAD_MAX_SIZE_MB || '10') * 1024 * 1024;
@Controller('auth')
export class AuthController {
  private profileImageBasePath;
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private verificationCodeService: VerificationCodeService,
  ) {
    this.profileImageBasePath = this.configService.get(
      'PROFILE_IMAGE_BASE_PATH',
    );
  }

  @Post('/signUp')
  signUp(@Body() signUpDto: SignUpDto): Promise<AuthEntity[]> {
    if (signUpDto.password != signUpDto.repeatPassword) {
      throw new BadRequestException(
        'password and repeatPassword must be matches.',
      );
    }
    return this.authService.signUp(signUpDto);
  }

  @Post('/logIn')
  async logIn(@Body() logInDto: LogInDto, @Response() res: Res) {
    const token = await this.authService.logIn(logInDto);

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
  async getProfile(@Request() req: Req) {
    const user = await this.authService.getProfile(req['user'].username);
    if (!user)
      throw new UnauthorizedException('Invalid Token. Need to login again.!');
    return user;
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEntity.admin)
  @Patch('/active')
  async activeUser(@Body() activeUserDto: ActiveUserDto) {
    const data = await this.authService.activeUser(activeUserDto);
    return {
      message: 'Change user active successful.',
      data,
    };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEntity.admin)
  @Get('/users')
  async getAllUsers(): Promise<AuthEntity[] | null> {
    return this.authService.getAllUsers();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEntity.admin)
  @Patch('/role')
  async changeRole(@Body() changeRole: ChangeRole) {}

  @UseGuards(AuthGuard)
  @Patch('/profile')
  async changeProfile(@Request() req: Req, @Body() profileDto: ProfileDto) {
    const username = req['user'].username;
    return this.authService.changeProfile(username, profileDto);
  }

  @Get('/image/:username')
  @ApiOkResponse({
    description: 'Image file',
    content: {
      'image/jpeg': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
      'image/png': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiProduces('image/jpeg', 'image/png') // Specify the possible MIME types
  getProfileImage(@Param('username') username: string, @Response() res: Res) {
    const imagePath = path.join(this.profileImageBasePath, username);
    if (existsSync(imagePath)) {
      res.setHeader('Content-Type', 'image/jpeg');
      const image = createReadStream(imagePath);
      image.pipe(res);
    } else {
      throw new NotFoundException('image not found.');
    }
  }

  @UseGuards(AuthGuard)
  @Post('/image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: ProfileImageDto,
  })
  @UseInterceptors(FileInterceptor('profileImage'))
  async updateProfileImage(
    @Request() req: Req,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
          new FileTypeValidator({
            fileType: /^image\/(jpeg|png|gif|webp|bmp|tiff|svg\+xml)$/,
          }),
        ],
      }),
    )
    profileImage: Express.Multer.File,
  ) {
    const username = req['user'].username;
    await writeFile(
      path.join(this.profileImageBasePath, username),
      profileImage.buffer,
    );
    return { message: 'file uploaded succesfully.' };
  }

  @Post('send-code')
  @ApiBody({
    description: 'Email address to send the verification code to',
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
      },
      required: ['email'],
    },
  })
  async sendCode(@Body('email') email: string) {
    const code = this.verificationCodeService.generateCode(email);

    await this.verificationCodeService.sendCode(email, code);

    return { message: 'Verification code sent' };
  }

  @Post('verify-code')
  @ApiBody({
    description: 'Email address to send the verification code to',
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        code: { type: 'string', example: '1234' },
      },
      required: ['email', 'code'],
    },
  })
  verifyCode(@Body('email') email: string, @Body('code') code: string) {
    const isValid = this.verificationCodeService.verifyCode(email, code);
    if (!isValid) throw new NotFoundException('Invalid or expired code');
    return { message: 'Email verified successfully' };
  }

  @Post('chnagePassword')
  async changePassword(dto:ChangePasswordDto){
    if (dto.newPassword != dto.confirmPassword) {
      throw new BadRequestException(
        'password and repeatPassword must be matches.',
      );
    }
    await this.authService.changePassword(dto)
    return { message: 'Password changed successfully' };
  }
}
