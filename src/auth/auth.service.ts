import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SignUpDto } from './dto/signUp.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthEntity } from './auth.entity';
import { Repository } from 'typeorm';
import { LogInDto } from './dto/logIn.dto';
import  {JwtService} from '@nestjs/jwt'
import { ActiveUserDto } from './dto/activeUser.dto';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { AuthDbInterface } from './auth.dbInterface';


@Injectable()
export class AuthService {
  private readonly authDbInterface:AuthDbInterface;

  constructor(
    @InjectRepository(AuthEntity)
    private readonly authRepository:Repository<AuthEntity>,
    private readonly jwtService:JwtService,
    private readonly config: ConfigService,
  ) {
    this.authDbInterface = new AuthDbInterface(this.authRepository)
  }

  signUp(signUpDto: SignUpDto):Promise<AuthEntity[]> {
    const data = this.destructDto2Entity(signUpDto);
    data.password = this.hashPass(data.password)
    return this.authDbInterface.addAuth(data);
  }

  async logIn(logInDto:LogInDto):Promise<string>{
    const {username , password} = logInDto;
    const hashedPassword = this.hashPass(password);
    const user =
      await this.authDbInterface.login(username , hashedPassword);
    if (!user)
      throw new UnauthorizedException('Invalid credentials');
    if (! user.isActive)
      throw new ForbiddenException('Your account is inactive.');

    return this.generateToken(user);
  }

  getProfile(userId:string):Promise<AuthEntity | null>{
    return this.authDbInterface.getUser(userId)
  }

  async activeUser(activeUserDto:ActiveUserDto){
    const user:AuthEntity | null =
      await this.authDbInterface.getUser(activeUserDto.userId);
    if (! user)
      throw new NotFoundException('this user id not found.')

    await this.authDbInterface.changeUserActivity(
      user ,
      activeUserDto.setActive
    )

    return {
      userid: user.id,
      isActive: user.isActive
    }
  }

  getAllUsers():Promise<AuthEntity[]>{
    return this.authDbInterface.getAll()
  }

  private destructDto2Entity(signUpDto:SignUpDto){
    const {
      username , password,
      name , email ,
      phoneNumber , birthday
    } = signUpDto
    return {
      username , password,
      name , email ,
      phoneNumber , birthday ,
    }
  }

  private hashPass(pass:string):string{
    const pepper = this.config.get<string>('PASSWORD_PEPPER');
    const pepperedPassword = pass + pepper;
    const hash = createHash('sha256');
    hash.update(pepperedPassword);
    return hash.digest('hex');
  }

  private generateToken(user: any): Promise<string> {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role
    };
    return this.jwtService.signAsync(payload)
  }

}
