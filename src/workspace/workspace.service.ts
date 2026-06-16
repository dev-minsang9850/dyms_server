// src/workspace/workspace.service.ts
import { Injectable, OnModuleInit, Logger, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceEntity } from './workspace.entity';
import { User } from '../users/users.entity';

@Injectable()
export class WorkspacesService implements OnModuleInit {
  private readonly logger = new Logger('WorkspacesService');
  private readonly defaultWorkspaces: string[] = [
    'DY@Software',
    'DY@InfoSec',
    'DY@AI',
    'DY@WEB',
    'DY@Design',
  ];

  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    // Seed default workspaces if the database has 0 workspaces
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      this.logger.error('ADMIN_EMAIL is not set in environment variables! Workspace seeding and migration skipped.');
      return;
    }
    try {
      const list = await this.findAllRaw();
      if (list.length === 0) {
        this.logger.log('No workspaces found. Seeding predefined workspaces...');
        for (const wsName of this.defaultWorkspaces) {
          await this.createWorkspaceRaw(wsName, adminEmail);
        }
        this.logger.log('Predefined workspaces seeded.');
      } else {
        this.logger.log('Workspaces already exist in DB. Checking for workspace owner email updates...');
        for (const ws of list) {
          // If the owner matches either legacy domain or the default fallback and differs from current configured adminEmail
          if (
            (ws.ownerEmail === 'admin@dy.hs.kr' || ws.ownerEmail === 'admin@dyhs.kr') &&
            ws.ownerEmail !== adminEmail
          ) {
            ws.ownerEmail = adminEmail;
            if (ws.memberEmails) {
              ws.memberEmails = ws.memberEmails.map((email) =>
                email === 'admin@dy.hs.kr' || email === 'admin@dyhs.kr' ? adminEmail : email,
              );
            }
            await this.workspaceRepository.save(ws);
          }
        }
      }
    } catch (e) {
      this.logger.error('Failed to seed default workspaces', e);
    }
  }

  private async findAllRaw(): Promise<WorkspaceEntity[]> {
    return this.workspaceRepository.find();
  }

  private async createWorkspaceRaw(name: string, ownerEmail: string): Promise<WorkspaceEntity> {
    const ws: WorkspaceEntity = {
      id: `ws-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name,
      ownerEmail,
      memberEmails: [ownerEmail],
    };

    return this.workspaceRepository.save(ws);
  }

  async findForUser(user: User): Promise<WorkspaceEntity[]> {
    const all = await this.findAllRaw();
    return all.filter((w) => {
      const isOwner = w.ownerEmail === user.email;
      const isAssigned = user.workspace && w.name.toLowerCase() === user.workspace.toLowerCase();
      const isMember = w.memberEmails && w.memberEmails.includes(user.email);
      return isOwner || isAssigned || isMember;
    });
  }

  async createWorkspace(name: string, user: User): Promise<WorkspaceEntity> {
    const all = await this.findAllRaw();
    const exists = all.some((w) => w.name.toLowerCase() === name.trim().toLowerCase());
    if (exists) {
      throw new ConflictException('이미 존재하는 워크스페이스 이름입니다.');
    }
    return this.createWorkspaceRaw(name.trim(), user.email);
  }

  async findById(id: string): Promise<WorkspaceEntity | undefined> {
    const ws = await this.workspaceRepository.findOne({ where: { id } });
    return ws || undefined;
  }

  async findAll(): Promise<WorkspaceEntity[]> {
    return this.findAllRaw();
  }

  async deleteWorkspace(id: string): Promise<void> {
    const ws = await this.findById(id);
    if (!ws) return;

    await this.workspaceRepository.delete(id);

    // Clear user's workspace settings
    await this.userRepository.update({ workspace: ws.name as any }, { workspace: null, position: 'none' });
  }

  async removeUserFromWorkspace(userEmail: string, workspaceId: string): Promise<void> {
    const all = await this.findAllRaw();
    const ws = all.find((w) => w.id === workspaceId);
    if (!ws) return;

    if (ws.memberEmails) {
      ws.memberEmails = ws.memberEmails.filter((email) => email !== userEmail);
      await this.workspaceRepository.save(ws);
    }

    // Update user's workspace and position
    await this.userRepository.update({ email: userEmail }, { workspace: null, position: 'none' });
  }

  // Add a user to a workspace (e.g. on approval)
  async addUserToWorkspace(userEmail: string, workspaceName: string) {
    const all = await this.findAllRaw();
    const ws = all.find((w) => w.name.toLowerCase() === workspaceName.toLowerCase());
    if (!ws) return;

    if (!ws.memberEmails) {
      ws.memberEmails = [];
    }
    if (!ws.memberEmails.includes(userEmail)) {
      ws.memberEmails.push(userEmail);
      await this.workspaceRepository.save(ws);
    }
  }

  async syncUserWorkspaces(userEmail: string, targetWorkspaces: string[]): Promise<void> {
    const all = await this.findAllRaw();
    const normalizedTargets = targetWorkspaces.map((w) => w.toLowerCase());

    for (const ws of all) {
      const isOwner = ws.ownerEmail === userEmail;
      if (isOwner) continue; // Owner cannot be removed from their own workspace

      const shouldBeMember = normalizedTargets.includes(ws.name.toLowerCase());
      const isMember = ws.memberEmails && ws.memberEmails.includes(userEmail);

      if (shouldBeMember && !isMember) {
        await this.addUserToWorkspace(userEmail, ws.name);
      } else if (!shouldBeMember && isMember) {
        await this.removeUserFromWorkspace(userEmail, ws.id);
      }
    }
  }
}
