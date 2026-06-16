import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { SchoolModule } from '../school/school.module';
import { PushModule } from '../push/push.module';
import { Chat } from './chat.entity';
import { Message } from './message.entity';
import { VoteEntity } from './vote.entity';
import { ChatEventEntity } from './chatevent.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat, Message, VoteEntity, ChatEventEntity]),
    AuthModule,
    UsersModule,
    SchoolModule,
    PushModule,
  ],
  providers: [ChatsService],
  controllers: [ChatsController],
  exports: [ChatsService],
})
export class ChatsModule {}
