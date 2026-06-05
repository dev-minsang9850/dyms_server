// src/workspace/workspace.service.ts
import { Injectable, ForbiddenException } from '@nestjs/common';
import { User, WorkspaceName } from '../users/users.entity';

interface Workspace {
  id: string;
  name: WorkspaceName;
  ownerId: string;
}

@Injectable()
export class WorkspacesService {
  private workspaces: Workspace[] = [];

  createWorkspace(name: WorkspaceName, user: User): Workspace {
    // 예: 이름에 따라 필요한 워크스페이스를 정하는 규칙
    const requiredWorkspace: WorkspaceName | undefined = name;

    if (requiredWorkspace && user.workspace !== requiredWorkspace) {
      throw new ForbiddenException(
        '이 워크스페이스를 만들 수 있는 소속이 아닙니다.',
      );
    }

    const ws: Workspace = {
      id: `ws-${Date.now()}`,
      name,
      ownerId: user.id,
    };

    this.workspaces.push(ws);
    return ws;
  }
}
