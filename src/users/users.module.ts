import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './users.entity';
import { WorkspacesModule } from '../workspace/workspace.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    WorkspacesModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService, TypeOrmModule.forFeature([User])],
})
export class UsersModule {}
