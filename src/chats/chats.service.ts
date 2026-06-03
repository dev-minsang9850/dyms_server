// src/chats/chats.service.ts
import { Injectable } from '@nestjs/common';
import { Chat } from './chat.entity';
import { Message } from './message.entity';
import { CreateChatDto } from './dto/create-chat.dto';

const formatTime = () => {
  const now = new Date();
  let h = now.getHours();
  const m = now.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? '오후' : '오전';
  h = h % 12 || 12;
  return `${ampm} ${h}:${m}`;
};

@Injectable()
export class ChatsService {
  private chats: Chat[] = [];
  private messages: Message[] = [];

  findAllForUser(userId: string): Chat[] {
    return this.chats.filter((c) => c.memberIds.includes(userId));
  }

  findMessages(chatId: string, limit = 50): Message[] {
    return this.messages.filter((m) => m.chatId === chatId).slice(-limit);
  }

  createChat(dto: CreateChatDto): Chat {
    const id = `c-${Date.now()}`;
    const name =
      dto.name || (dto.memberIds.length > 1 ? '단체 채팅방' : '1:1 채팅');
    const chat: Chat = {
      id,
      name,
      type: dto.memberIds.length > 1 ? 'group' : 'direct',
      memberIds: dto.memberIds,
      lastMessage: '채팅방이 개설되었습니다.',
      lastMessageTime: formatTime(),
      unreadCount: 0,
    };
    this.chats.unshift(chat);

    const sysMsg: Message = {
      id: `sys-${Date.now()}`,
      chatId: id,
      senderId: 'system',
      content: '대화가 시작되었습니다.',
      createdAt: formatTime(),
    };
    this.messages.push(sysMsg);

    return chat;
  }

  sendMessage(chatId: string, senderId: string, content: string): Message {
    const msg: Message = {
      id: `m-${Date.now()}`,
      chatId,
      senderId,
      content,
      createdAt: formatTime(),
    };
    this.messages.push(msg);

    this.chats = this.chats.map((c) =>
      c.id === chatId
        ? {
            ...c,
            lastMessage: content,
            lastMessageTime: msg.createdAt,
            unreadCount: 0,
          }
        : c,
    );

    return msg;
  }
}
