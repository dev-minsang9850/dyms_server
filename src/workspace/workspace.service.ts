// src/workspace/workspace.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { User } from '../users/users.entity';

export interface Workspace {
  id: string;
  name: string;
  ownerEmail: string;
  memberEmails?: string[];
}

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

  constructor(private readonly firebaseService: FirebaseService) {}

  async onModuleInit() {
    // Seed default workspaces if they do not exist
    try {
      const list = await this.findAllRaw();
      for (const wsName of this.defaultWorkspaces) {
        const exists = list.some((w) => w.name === wsName);
        if (!exists) {
          await this.createWorkspaceRaw(wsName, 'admin@dy.hs.kr');
        }
      }
      this.logger.log('Predefined workspaces verified/seeded.');
    } catch (e) {
      this.logger.error('Failed to seed default workspaces', e);
    }
  }

  private getCollection() {
    return this.firebaseService.db?.collection('workspaces');
  }

  private async findAllRaw(): Promise<Workspace[]> {
    if (this.firebaseService.isFallback()) {
      return this.firebaseService.fallbackDb.workspaces;
    }
    const snapshot = await this.getCollection()!.get();
    return snapshot.docs.map((doc) => doc.data() as Workspace);
  }

  private async createWorkspaceRaw(name: string, ownerEmail: string): Promise<Workspace> {
    const ws: Workspace = {
      id: `ws-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name,
      ownerEmail,
      memberEmails: [ownerEmail],
    };

    if (this.firebaseService.isFallback()) {
      this.firebaseService.fallbackDb.workspaces.push(ws);
      return ws;
    }

    await this.getCollection()!.doc(ws.id).set(ws);
    return ws;
  }

  async findForUser(user: User): Promise<Workspace[]> {
    const all = await this.findAllRaw();
    return all.filter((w) => {
      const isOwner = w.ownerEmail === user.email;
      const isAssigned = user.workspace && w.name.toLowerCase() === user.workspace.toLowerCase();
      const isMember = w.memberEmails && w.memberEmails.includes(user.email);
      return isOwner || isAssigned || isMember;
    });
  }

  async createWorkspace(name: string, user: User): Promise<Workspace> {
    return this.createWorkspaceRaw(name, user.email);
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

      if (!this.firebaseService.isFallback()) {
        await this.getCollection()!.doc(ws.id).update({
          memberEmails: ws.memberEmails,
        });
      }
    }
  }
}
