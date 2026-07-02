// src/chats/chats.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
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
  workspace?: string;
}

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get()
  getMyChats(@Req() req: { user: RequestUser }) {
    const user = req.user;
    return this.chatsService.findAllForUserAndWorkspace(
      user.id,
      user.workspace,
    );
  }

  @Post()
  createChat(@Req() req: { user: RequestUser }, @Body() dto: CreateChatDto) {
    const memberIds = [...(dto.memberIds || [])];
    if (!memberIds.includes(req.user.id)) {
      memberIds.push(req.user.id);
    }
    return this.chatsService.createChat({
      ...dto,
      memberIds,
      workspace: req.user.workspace,
    });
  }

  @Patch(':id/name')
  updateCustomName(
    @Param('id') id: string,
    @Req() req: { user: RequestUser },
    @Body('customName') customName: string,
  ) {
    return this.chatsService.updateCustomName(id, req.user.id, customName);
  }

  @Delete(':id/leave')
  leaveChat(
    @Param('id') id: string,
    @Req() req: { user: RequestUser },
  ) {
    return this.chatsService.leaveChat(id, req.user.id);
  }

  @Get(':id/messages')
  getMessages(
    @Param('id') id: string,
    @Req() req: { user: RequestUser },
    @Query('limit') limit?: string,
  ) {
    const l = limit ? parseInt(limit, 10) : 50;
    return this.chatsService.findMessages(id, req.user.id, l);
  }

  @Post(':id/messages')
  sendMessage(
    @Param('id') id: string,
    @Req() req: { user: RequestUser },
    @Body() dto: SendMessageDto,
  ) {
    const user = req.user;
    return this.chatsService.sendMessage(
      id,
      user.id,
      dto.content,
      dto.fileUrl,
      dto.fileName,
      dto.fileType,
    );
  }

  // 투표 생성
  @Post(':id/votes')
  createVote(
    @Param('id') id: string,
    @Req() req: { user: RequestUser },
    @Body('title') title: string,
    @Body('options') options: string[],
  ) {
    return this.chatsService.createVote(id, req.user.id, title, options);
  }

  // 투표 목록 조회
  @Get(':id/votes')
  getVotes(@Param('id') id: string) {
    return this.chatsService.getVotes(id);
  }

  // 투표 수정
  @Patch(':id/votes/:voteId')
  updateVote(
    @Param('id') id: string,
    @Param('voteId') voteId: string,
    @Req() req: { user: RequestUser },
    @Body('title') title: string,
    @Body('options') options: string[],
  ) {
    return this.chatsService.updateVote(voteId, req.user.id, title, options);
  }

  // 투표 참여
  @Post(':id/votes/:voteId/participate')
  participateVote(
    @Param('voteId') voteId: string,
    @Req() req: { user: RequestUser },
    @Body('optionIndex') optionIndex: number,
  ) {
    return this.chatsService.participateVote(voteId, req.user.id, optionIndex);
  }

  // 투표 마감
  @Patch(':id/votes/:voteId/close')
  closeVote(
    @Param('voteId') voteId: string,
    @Req() req: { user: RequestUser },
  ) {
    return this.chatsService.closeVote(voteId, req.user.id);
  }

  // 일정 생성
  @Post(':id/events')
  createEvent(
    @Param('id') id: string,
    @Req() req: { user: RequestUser },
    @Body('title') title: string,
    @Body('description') description: string,
    @Body('eventDate') eventDate: string,
  ) {
    return this.chatsService.createEvent(
      id,
      req.user.id,
      title,
      description,
      eventDate,
    );
  }

  // 일정 목록 조회
  @Get(':id/events')
  getEvents(@Param('id') id: string) {
    return this.chatsService.getEvents(id);
  }
}
