// src/chats/chat.entity.ts
export type ChatType = 'direct' | 'group';

export class Chat {
  id!: string;
  name!: string;
  type!: ChatType;
  memberIds!: string[];
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount!: number;
}
