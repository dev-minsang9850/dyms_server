// src/chats/dto/send-message.dto.ts
export class SendMessageDto {
  content!: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}

