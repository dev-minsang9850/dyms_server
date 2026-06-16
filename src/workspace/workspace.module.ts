import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspacesService } from './workspace.service';
import { WorkspacesController } from './workspace.controller';
import { WorkspaceEntity } from './workspace.entity';
import { User } from '../users/users.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorkspaceEntity, User])],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
