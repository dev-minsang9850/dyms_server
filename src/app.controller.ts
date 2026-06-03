// src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot() {
    // 클라이언트가 "서버 살아있냐" 확인할 때 쓰는 용도
    return this.appService.getHello();
  }
}
