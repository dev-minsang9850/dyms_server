// src/chats/chats.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Chat } from './chat.entity';
import { Message } from './message.entity';
import { CreateChatDto } from './dto/create-chat.dto';
import { FirebaseService } from '../firebase/firebase.service';

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
  constructor(private readonly firebaseService: FirebaseService) {}

  private getChatsCollection() {
    return this.firebaseService.db?.collection('chats');
  }

  private getMessagesCollection(chatId: string) {
    return this.firebaseService.db?.collection('chats').doc(chatId).collection('messages');
  }

  async findAllForUser(userId: string): Promise<Chat[]> {
    if (this.firebaseService.isFallback()) {
      return this.firebaseService.fallbackDb.chats.filter((c: any) => c.memberIds.includes(userId));
    }

    try {
      const snapshot = await this.getChatsCollection()!
        .where('memberIds', 'array-contains', userId)
        .get();
      return snapshot.docs.map((doc) => doc.data() as Chat);
    } catch (e) {
      console.error('Error fetching chats from Firestore', e);
      return [];
    }
  }

  async findMessages(chatId: string, limit = 50): Promise<Message[]> {
    if (this.firebaseService.isFallback()) {
      const list = this.firebaseService.fallbackDb.messages[chatId] || [];
      return list.slice(-limit);
    }

    try {
      // Order messages by sub-document timestamp.
      // Firestore does not require complex index if we do not filter, but sorting by createdAt needs index.
      // To prevent index creation errors, we can just load the last messages and sort in memory, or query and sort.
      // Getting doc snapshots and sorting them in memory by createdAt or id is safer for zero-config startup.
      const snapshot = await this.getMessagesCollection(chatId)!
        .limit(limit)
        .get();
      const msgs = snapshot.docs.map((doc) => doc.data() as Message);
      
      // Sort in memory by ID or timestamp (system-xxxx or m-xxxx) to ensure correct order
      return msgs.sort((a, b) => a.id.localeCompare(b.id));
    } catch (e) {
      console.error('Error fetching messages from Firestore', e);
      return [];
    }
  }

  async createChat(dto: CreateChatDto): Promise<Chat> {
    const id = `c-${Date.now()}`;
    const name = dto.name || (dto.memberIds.length > 1 ? '단체 채팅방' : '1:1 채팅');
    
    const chat: Chat = {
      id,
      name,
      type: dto.memberIds.length > 1 ? 'group' : 'direct',
      memberIds: dto.memberIds,
      lastMessage: '채팅방이 개설되었습니다.',
      lastMessageTime: formatTime(),
      unreadCount: 0,
    };

    const sysMsg: Message = {
      id: `sys-${Date.now()}`,
      chatId: id,
      senderId: 'system',
      content: '대화가 시작되었습니다.',
      createdAt: formatTime(),
    };

    if (this.firebaseService.isFallback()) {
      this.firebaseService.fallbackDb.chats.unshift(chat);
      if (!this.firebaseService.fallbackDb.messages[id]) {
        this.firebaseService.fallbackDb.messages[id] = [];
      }
      this.firebaseService.fallbackDb.messages[id].push(sysMsg);
      return chat;
    }

    await this.getChatsCollection()!.doc(id).set(chat);
    await this.getMessagesCollection(id)!.doc(sysMsg.id).set(sysMsg);

    return chat;
  }

  async sendMessage(chatId: string, senderId: string, content: string): Promise<Message> {
    const msg: Message = {
      id: `m-${Date.now()}`,
      chatId,
      senderId,
      content,
      createdAt: formatTime(),
    };

    if (this.firebaseService.isFallback()) {
      if (!this.firebaseService.fallbackDb.messages[chatId]) {
        this.firebaseService.fallbackDb.messages[chatId] = [];
      }
      this.firebaseService.fallbackDb.messages[chatId].push(msg);

      this.firebaseService.fallbackDb.chats = this.firebaseService.fallbackDb.chats.map((c: any) =>
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

    // Write message document
    await this.getMessagesCollection(chatId)!.doc(msg.id).set(msg);

    // Update last message in parent chat document
    await this.getChatsCollection()!.doc(chatId).update({
      lastMessage: content,
      lastMessageTime: msg.createdAt,
      unreadCount: 0,
    });

    return msg;
  }
}
