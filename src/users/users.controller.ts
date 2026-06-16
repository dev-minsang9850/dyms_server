// src/users/users.controller.ts
import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  ForbiddenException,
  NotFoundException,
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
    @Body('workspace') workspace?: string,
    @Body('workspaces') workspaces?: string[],
  ) {
    if (!req.user.isAdmin) {
      throw new ForbiddenException('관리자 권한이 필요합니다.');
    }
    const selectedWorkspaces = workspaces || (workspace ? [workspace] : []);
    if (selectedWorkspaces.length === 0) {
      throw new ForbiddenException('최소 한 개 이상의 워크스페이스를 지정해야 합니다.');
    }

    const defaultWorkspace = selectedWorkspaces[0];
    const approvedUser = await this.usersService.approve(id, defaultWorkspace as WorkspaceName);

    // 모든 지정된 워크스페이스에 멤버로 추가
    for (const ws of selectedWorkspaces) {
      await this.workspacesService.addUserToWorkspace(approvedUser.email, ws);
    }
    return approvedUser;
  }

  // 관리자: 유저 소속 워크스페이스 동기화/변경
  @Patch(':id/workspaces')
  async updateUserWorkspaces(
    @Param('id') id: string,
    @Req() req: { user: User },
    @Body('workspaces') workspaces: string[],
  ) {
    if (!req.user.isAdmin) {
      throw new ForbiddenException('관리자 권한이 필요합니다.');
    }
    const targetUser = await this.usersService.findById(id);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (!workspaces || workspaces.length === 0) {
      throw new ForbiddenException('최소 한 개 이상의 워크스페이스를 지정해야 합니다.');
    }

    // 1. 만약 현재 활성화된 워크스페이스가 리스트에 없다면, 첫 번째 워크스페이스로 강제 변경
    let currentWorkspace = targetUser.workspace;
    if (!currentWorkspace || !workspaces.includes(currentWorkspace)) {
      currentWorkspace = workspaces[0] as WorkspaceName;
      await this.usersService.updateWorkspace(targetUser.id, currentWorkspace);
    }

    // 2. 전체 워크스페이스 멤버십 동기화
    await this.workspacesService.syncUserWorkspaces(targetUser.email, workspaces);

    const updatedUser = await this.usersService.findById(id);
    return updatedUser;
  }

  // 본인 정보 조회
  @Get('me')
  async getMyProfile(@Req() req: { user: User }) {
    const freshUser = await this.usersService.findById(req.user.id);
    if (!freshUser) {
      throw new NotFoundException('User not found');
    }
    const { password: _password, ...safeUser } = freshUser;
    return safeUser;
  }

  // 본인 개인정보 수정 (이름, 연락처, 비밀번호, 학년/반/번호)
  @Patch('me/profile')
  async updateMyProfile(
    @Req() req: { user: User },
    @Body() body: {
      name?: string;
      phone?: string;
      grade?: number;
      class?: number;
      number?: number;
      password?: string;
    },
  ) {
    return this.usersService.updateProfile(req.user.id, body);
  }

  // 본인 상태 메시지 수정
  @Patch('me/status')
  async updateMyStatus(
    @Req() req: { user: User },
    @Body('statusMessage') statusMessage: string,
  ) {
    return this.usersService.updateStatusMessage(req.user.id, statusMessage);
  }

  // 본인 푸시 토큰 등록 (FCM / Expo Push)
  @Patch('me/push-token')
  async updateMyPushToken(
    @Req() req: { user: User },
    @Body('pushToken') pushToken: string,
  ) {
    return this.usersService.updatePushToken(req.user.id, pushToken);
  }

  // 본인 워크스페이스 소속 수정 (선택/이동 시 동기화)
  @Patch('me/workspace')
  async updateMyWorkspace(
    @Req() req: { user: User },
    @Body('workspace') workspace: string,
  ) {
    const updatedUser = await this.usersService.updateWorkspace(req.user.id, workspace as WorkspaceName);
    // 선택한 워크스페이스의 멤버로 자동 추가
    await this.workspacesService.addUserToWorkspace(updatedUser.email, workspace);
    return updatedUser;
  }

  // 동일 단체 멤버 조회
  @Get('workspace-members')
  async getWorkspaceMembers(@Req() req: { user: User }) {
    if (!req.user.workspace) {
      return [];
    }
    return this.usersService.findByWorkspace(req.user.workspace);
  }

  // 어드민/담당교사/부장용 직책 임명
  @Patch(':id/position')
  async updatePosition(
    @Param('id') id: string,
    @Req() req: { user: User },
    @Body('position') position: string,
  ) {
    const targetUser = await this.usersService.findById(id);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }
    const isAuthorized =
      req.user.isAdmin ||
      req.user.role === 'teacher' ||
      (req.user.position === 'head' && req.user.workspace?.toLowerCase() === targetUser.workspace?.toLowerCase());

    if (!isAuthorized) {
      throw new ForbiddenException('직책을 변경할 권한이 없습니다.');
    }

    return this.usersService.updatePosition(id, position as any);
  }

  // 어드민/담당교사용 비밀번호 초기화/변경
  @Patch(':id/password')
  async updatePassword(
    @Param('id') id: string,
    @Req() req: { user: User },
    @Body('password') password?: string,
  ) {
    const isAuthorized = req.user.isAdmin || req.user.role === 'teacher';
    if (!isAuthorized) {
      throw new ForbiddenException('비밀번호를 변경할 권한이 없습니다.');
    }

    const newPassword = password || Math.random().toString(36).substring(2, 10);
    const updated = await this.usersService.updatePassword(id, newPassword);
    return { id: updated.id, email: updated.email, tempPassword: password ? undefined : newPassword };
  }

  // 관리자: 회원 강퇴 및 영구 삭제
  @Delete(':id')
  async deleteUser(
    @Param('id') id: string,
    @Req() req: { user: User },
  ) {
    if (!req.user.isAdmin) {
      throw new ForbiddenException('관리자 권한이 필요합니다.');
    }
    const targetUser = await this.usersService.findById(id);
    if (targetUser && targetUser.workspace) {
      const allWorkspaces = await this.workspacesService.findAll();
      const ws = allWorkspaces.find((w) => w.name.toLowerCase() === targetUser.workspace!.toLowerCase());
      if (ws) {
        await this.workspacesService.removeUserFromWorkspace(targetUser.email, ws.id);
      }
    }
    return this.usersService.delete(id);
  }
}
