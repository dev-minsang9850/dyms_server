// src/users/users.controller.ts
import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User, WorkspaceName } from './users.entity';
import { WorkspacesService } from '../workspace/workspace.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  // 관리자: 전체 사용자 조회
  @Get()
  async getAllUsers(@Req() req: { user: User }) {
    if (!req.user.isAdmin) {
      throw new ForbiddenException('관리자 권한이 필요합니다.');
    }
    return this.usersService.findAll();
  }

  // 관리자: 승인 대기 중인 유저 목록
  @Get('pending')
  async getPendingUsers(@Req() req: { user: User }) {
    if (!req.user.isAdmin) {
      throw new ForbiddenException('관리자 권한이 필요합니다.');
    }
    return this.usersService.findPending();
  }

  // 관리자: 특정 유저 승인 및 단체(워크스페이스) 배정
  @Patch(':id/approve')
  async approveUser(
    @Param('id') id: string,
    @Req() req: { user: User },
    @Body('workspace') workspace: string,
  ) {
    if (!req.user.isAdmin) {
      throw new ForbiddenException('관리자 권한이 필요합니다.');
    }
    const approvedUser = await this.usersService.approve(id, workspace);
    // 지정된 워크스페이스에 유저 이메일을 멤버로 등록
    await this.workspacesService.addUserToWorkspace(approvedUser.email, workspace);
    return approvedUser;
  }

  // 본인 상태 메시지 수정
  @Patch('me/status')
  async updateMyStatus(
    @Req() req: { user: User },
    @Body('statusMessage') statusMessage: string,
  ) {
    return this.usersService.updateStatusMessage(req.user.id, statusMessage);
  }

  // 본인 워크스페이스 소속 수정 (선택/이동 시 동기화)
  @Patch('me/workspace')
  async updateMyWorkspace(
    @Req() req: { user: User },
    @Body('workspace') workspace: string,
  ) {
    const updatedUser = await this.usersService.updateWorkspace(req.user.id, workspace);
    // 선택한 워크스페이스의 멤버로 자동 추가
    await this.workspacesService.addUserToWorkspace(updatedUser.email, workspace);
    return updatedUser;
  }
}
