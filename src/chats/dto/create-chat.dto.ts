// src/chats/dto/create-chat.dto.ts
export class CreateChatDto {
  memberIds!: string[];
  name?: string;
  workspace?: string;
}
