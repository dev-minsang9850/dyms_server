// src/chats/chats.module.ts
import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [ChatsService],
  controllers: [ChatsController],
})
export class ChatsModule {}
