import { Repository } from 'typeorm';
import { AuthEntity } from './auth.entity';
import { ConflictException } from '@nestjs/common';

export class AuthDbInterface {
  constructor(private readonly authRepository: Repository<AuthEntity>) {}
  async addAuth(data): Promise<AuthEntity[]> {
    await this.checkUniquePrometers(data);
    const user = this.authRepository.create(data);
    return this.authRepository.save(user);
  }
  login(username: string, hashedPassword: string): Promise<AuthEntity | null> {
    return this.authRepository
      .createQueryBuilder('logIn')
      .select(['logIn.username', 'logIn.role', 'logIn.isActive'])
      .where('(username = :username OR email = :username)', { username })
      .andWhere('password = :password', { password: hashedPassword })
      .getOne();
  }

  getUser(username: string): Promise<AuthEntity | null> {
    return this.authRepository.findOneBy({ username });
  }

  getAll(): Promise<AuthEntity[] | null> {
    return this.authRepository
      .createQueryBuilder('getAllUsername')
      .select(['logIn.username'])
      .where('(isActive = true)')
      .getMany();
  }

  changeUserActivity(user: AuthEntity, setActive: boolean) {
    user.isActive = setActive;
    return this.authRepository.save<AuthEntity>(user);
  }

  async checkUserExists(username: string, email: string) {
    const user: AuthEntity | null = await this.authRepository.findOne({
      where: [{ username }, { email }],
    });

    if (user) throw new ConflictException('username or email does exists.');
  }

  private async checkUniquePrometers(data) {
    const { username, email } = data;
    try {
      await this.authRepository
        .createQueryBuilder('check')
        .select(['check.username'])
        .where('(username = :username OR email = :email)', { username, email })
        .getOneOrFail();
      throw new ConflictException('email or username is duplicate.');
    } catch (error) {}
  }
}
