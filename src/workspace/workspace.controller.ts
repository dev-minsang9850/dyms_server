// src/workspace/workspace.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { WorkspacesService } from './workspace.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../users/users.entity';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  async getMyWorkspaces(@Req() req: { user: User }) {
    return this.workspacesService.findForUser(req.user);
  }

  @Get('all')
  async getAllWorkspaces(@Req() req: { user: User }) {
    if (!req.user.isAdmin) {
      throw new ForbiddenException('관리자 권한이 필요합니다.');
    }
    return this.workspacesService.findAll();
  }

  @Post()
  async createWorkspace(
    @Req() req: { user: User },
    @Body('name') name: string,
  ) {
    return this.workspacesService.createWorkspace(name, req.user);
  }

  @Delete(':id')
  async deleteWorkspace(@Req() req: { user: User }, @Param('id') id: string) {
    const ws = await this.workspacesService.findById(id);
    if (!ws) {
      throw new NotFoundException('Workspace not found');
    }
    if (!req.user.isAdmin && ws.ownerEmail !== req.user.email) {
      throw new ForbiddenException('워크스페이스 삭제 권한이 없습니다.');
    }
    await this.workspacesService.deleteWorkspace(id);
    return { success: true };
  }

  @Post(':id/members')
  async addMember(
    @Req() req: { user: User },
    @Param('id') id: string,
    @Body('email') email: string,
  ) {
    const ws = await this.workspacesService.findById(id);
    if (!ws) {
      throw new NotFoundException('Workspace not found');
    }
    const isAuthorized =
      req.user.isAdmin ||
      req.user.role === 'teacher' ||
      ws.ownerEmail === req.user.email ||
      (req.user.position === 'head' && req.user.workspace?.toLowerCase() === ws.name.toLowerCase());

    if (!isAuthorized) {
      throw new ForbiddenException('멤버를 추가할 권한이 없습니다.');
    }
    await this.workspacesService.addUserToWorkspace(email, ws.name);
    return { success: true };
  }

  @Delete(':id/members/:email')
  async removeMember(
    @Req() req: { user: User },
    @Param('id') id: string,
    @Param('email') email: string,
  ) {
    const ws = await this.workspacesService.findById(id);
    if (!ws) {
      throw new NotFoundException('Workspace not found');
    }
    const isAuthorized =
      req.user.isAdmin ||
      req.user.role === 'teacher' ||
      ws.ownerEmail === req.user.email ||
      (req.user.position === 'head' && req.user.workspace?.toLowerCase() === ws.name.toLowerCase());

    if (!isAuthorized) {
      throw new ForbiddenException('멤버를 제외할 권한이 없습니다.');
    }
    await this.workspacesService.removeUserFromWorkspace(email, id);
    return { success: true };
  }
}
