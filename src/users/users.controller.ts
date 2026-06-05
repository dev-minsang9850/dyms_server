// src/users/users.controller.ts
import { Controller, Get, Patch, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 관리자: 승인 대기 중인 유저 목록
  @Get('pending')
  getPendingUsers() {
    return this.usersService.findPending();
  }

  // 관리자: 특정 유저 승인
  @Patch(':id/approve')
  approveUser(@Param('id') id: string) {
    return this.usersService.approve(id);
  }
}
