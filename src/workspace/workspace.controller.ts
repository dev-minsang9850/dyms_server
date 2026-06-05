// src/workspace/workspace.controller.ts
import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
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

  @Post()
  async createWorkspace(
    @Req() req: { user: User },
    @Body('name') name: string,
  ) {
    return this.workspacesService.createWorkspace(name, req.user);
  }
}
