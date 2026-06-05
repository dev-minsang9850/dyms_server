// src/workspace/workspace.module.ts
import { Module } from '@nestjs/common';
import { WorkspacesService } from './workspace.service';
import { WorkspacesController } from './workspace.controller';

@Module({
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
