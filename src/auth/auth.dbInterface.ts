import { Repository } from 'typeorm';
import { AuthEntity } from './auth.entity';
import { SignUpDto } from './dto/signUp.dto';

export class  AuthDbInterface {
  constructor(private readonly authRepository:Repository<AuthEntity>) {}
  addAuth(data):Promise<AuthEntity[]>{
    const user = this.authRepository.create(data)
    return this.authRepository.save(user)
  }
  login(username:string , hashedPassword:string):Promise<AuthEntity|null>{
    return this.authRepository.createQueryBuilder('logIn')
      .select([
        'logIn.id',
        'logIn.username',
        'logIn.role',
        'logIn.isActive'
      ])
      .where(
        '(username = :username OR "phoneNumber" = :username OR email = :username)',
        { username }
      )
      .andWhere('password = :password', { password:hashedPassword })
      .getOne()
  }

  getUser(userId:string):Promise<AuthEntity | null>{
    return this.authRepository.findOneBy({id:userId})
  }

  getAll():Promise<AuthEntity[]>{
    return this.authRepository.find()
  }

  changeUserActivity(user: AuthEntity , setActive: boolean) {
    user.isActive = setActive
    return this.authRepository.save<AuthEntity>(user)
  }
}
