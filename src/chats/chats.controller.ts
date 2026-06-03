// src/chats/chats.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';

interface RequestUser {
  id: string;
  email?: string;
}

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get()
  getMyChats(@Req() req: { user: RequestUser }) {
    const user = req.user;
    return this.chatsService.findAllForUser(user.id);
  }

  @Post()
  createChat(@Body() dto: CreateChatDto) {
    return this.chatsService.createChat(dto);
  }

  @Get(':id/messages')
  getMessages(@Param('id') id: string, @Query('limit') limit?: string) {
    const l = limit ? parseInt(limit, 10) : 50;
    return this.chatsService.findMessages(id, l);
  }

  @Post(':id/messages')
  sendMessage(
    @Param('id') id: string,
    @Req() req: { user: RequestUser },
    @Body() dto: SendMessageDto,
  ) {
    const user = req.user;
    return this.chatsService.sendMessage(id, user.id, dto.content);
  }
}
