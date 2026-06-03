// src/chats/message.entity.ts
export class Message {
  id!: string;
  chatId!: string;
  senderId!: string;
  content!: string;
  createdAt!: string;
}
