import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import * as NodeCache from 'node-cache';

@Injectable()
export class VerificationCodeService {
  private cache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // TTL in seconds
  
  constructor(private readonly mailerService: MailerService) {}

  generateCode(email: string): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    this.cache.set(email, code);
    return code;
  }

  verifyCode(email: string, code: string): boolean {
    const storedCode = this.cache.get<string>(email);
    if (storedCode && storedCode === code) {
      this.cache.del(email);
      return true;
    }
    return false;
  }

  async sendCode(email: string, code: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Your Verification Code',
      text: `Your code is: ${code}`,
      html: `<b>${code}</b>`,
    });
  }
}
