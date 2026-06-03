// src/app.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      service: 'DYMS Server',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
