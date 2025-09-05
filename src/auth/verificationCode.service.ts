import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as NodeCache from 'node-cache';

@Injectable()
export class VerificationCodeService {
  private cache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // TTL in seconds
  
  constructor() {}

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
    let data = JSON.stringify({
      "to": email,
      "code": code
    });

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://afzalzademohammad.app.n8n.cloud/webhook-test/Send mail',
      headers: { 
        'Content-Type': 'application/json'
      },
      data : data
    };

    axios.request(config)
    .then((response) => {
      console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error);
    });
  }
}
