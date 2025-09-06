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
import { ProfileDto } from './dto/profile.dto';
import { JwtService } from '@nestjs/jwt';
import { ActiveUserDto } from './dto/activeUser.dto';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { AuthDbInterface } from './auth.dbInterface';
import { TaskEntity } from 'src/task/task.entity';
import { Accessibility, TaskShareEntity } from 'src/task/task-share.entity';

@Injectable()
export class AuthService {
  private readonly authDbInterface: AuthDbInterface;

  constructor(
    @InjectRepository(AuthEntity)
    private readonly authRepository: Repository<AuthEntity>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(TaskEntity)
    private readonly taskRepo: Repository<TaskEntity>,
    @InjectRepository(TaskShareEntity)
    private readonly shareRepo: Repository<TaskShareEntity>,

  ) {
    this.authDbInterface = new AuthDbInterface(this.authRepository);
  }

  async signUp(signUpDto: SignUpDto): Promise<AuthEntity[]> {
    await this.authDbInterface.checkUserExists(
      signUpDto.username,
      signUpDto.email,
    );
    const data = this.destructDto2Entity(signUpDto);
    data.password = this.hashPass(data.password);
    return this.authDbInterface.addAuth(data);
  }

  async logIn(logInDto: LogInDto): Promise<string> {
    const { username, password } = logInDto;
    const hashedPassword = this.hashPass(password);
    const user = await this.authDbInterface.login(username, hashedPassword);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive)
      throw new ForbiddenException('Your account is inactive.');

    return this.generateToken(user);
  }

  getProfile(username: string): Promise<AuthEntity | null> {
    return this.authDbInterface.getUser(username);
  }

  async changeProfile(
    username: string,
    profileDto: ProfileDto,
  ): Promise<AuthEntity[]> {
    let user: AuthEntity | null = await this.authDbInterface.getUser(username);
    if (!user) throw new NotFoundException('this user id not found.');

    user = this.updateTargetIfSourceValid(profileDto, user);

    return this.authDbInterface.addAuth(user);
  }

  async activeUser(activeUserDto: ActiveUserDto) {
    const user: AuthEntity | null = await this.authDbInterface.getUser(
      activeUserDto.username,
    );
    if (!user) throw new NotFoundException('this user id not found.');

    await this.authDbInterface.changeUserActivity(
      user,
      activeUserDto.setActive,
    );

    if (!activeUserDto.setActive){
      await this.removeAssigne(activeUserDto.username);
      await this.removeCreator(activeUserDto.username);
    }

    return {
      username: user.username,
      isActive: user.isActive,
    };
  }

  private async removeCreator(username: string){
    const creatorTasks = await this.taskRepo.find({ where: { creator: username } });
    for (const task of creatorTasks) {
      const replacement = await this.findBestReplacement(task.id, username);
      task.creator = replacement || 'admin';
      await this.taskRepo.save(task);
    }
  }
  private async findBestReplacement(taskId: string, disabledUser: string): Promise<string | null> {
    const shares = await this.shareRepo.find({
      where: { task: { id: taskId } },
      relations: ['user'],
    });

    if (!shares.length) return null;

    // sort by privilege order
    const privilegeOrder = {
      [Accessibility.Owner]: 1,
      [Accessibility.Admin]: 2,
      [Accessibility.Observer]: 3,
    };

    const best = shares
      .filter((s) => s.user.username !== disabledUser) // exclude disabled user
      .sort(
        (a, b) =>
          privilegeOrder[a.accessibility] - privilegeOrder[b.accessibility],
      )[0];

    return best ? best.user.username : null;
  }
  private async removeAssigne(username:string){
    const assigneeTasks = await this.taskRepo
      .createQueryBuilder('task')
      .where(':username = ANY(task.assignes)', { username })
      .getMany();

    for (const task of assigneeTasks) {
      task.assignes = task.assignes.map((user) =>
        user === username ? `<del>${user}</del>` : user,
      );
      await this.taskRepo.save(task);
    }
  }

  getAllUsers(): Promise<AuthEntity[] | null> {
    return this.authDbInterface.getAll();
  }

  private destructDto2Entity(signUpDto: SignUpDto) {
    const { username, password, email } = signUpDto;
    return {
      username,
      password,
      email,
    };
  }

  private hashPass(pass: string): string {
    const pepper = this.config.get<string>('PASSWORD_PEPPER');
    const pepperedPassword = pass + pepper;
    const hash = createHash('sha256');
    hash.update(pepperedPassword);
    return hash.digest('hex');
  }

  private generateToken(user: any): Promise<string> {
    const payload = {
      username: user.username,
      role: user.role,
    };
    return this.jwtService.signAsync(payload);
  }

  private updateTargetIfSourceValid(source, target) {
    for (const [key, value] of Object.entries(source)) {
      if (value !== null && value !== '') {
        target[key] = value;
      }
    }
    return target;
  }
}
