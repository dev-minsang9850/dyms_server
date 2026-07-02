import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './chat.entity';
import { Message } from './message.entity';
import { VoteEntity } from './vote.entity';
import { ChatEventEntity } from './chatevent.entity';
import { CreateChatDto } from './dto/create-chat.dto';
import { UsersService } from '../users/users.service';
import { SchoolService } from '../school/school.service';
import { PushService } from '../push/push.service';

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
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(VoteEntity)
    private readonly voteRepository: Repository<VoteEntity>,
    @InjectRepository(ChatEventEntity)
    private readonly eventRepository: Repository<ChatEventEntity>,
    private readonly usersService: UsersService,
    private readonly schoolService: SchoolService,
    private readonly pushService: PushService,
  ) {}

  async findAllForUserAndWorkspace(userId: string, workspace?: string): Promise<Chat[]> {
    try {
      const qb = this.chatRepository.createQueryBuilder('chat');
      // PostgreSQL array check
      qb.where(':userId = ANY(chat.memberIds)', { userId });
      if (workspace) {
        qb.andWhere('LOWER(chat.workspace) = LOWER(:workspace)', { workspace });
      }
      const list = await qb.getMany();

      return list.map((c) => {
        const unreadCount = c.unreadCounts ? (c.unreadCounts[userId] || 0) : 0;
        return { ...c, unreadCount };
      });
    } catch (e) {
      console.error('Error fetching chats from PostgreSQL', e);
      return [];
    }
  }

  async findMessages(chatId: string, userId: string, limit = 50): Promise<Message[]> {
    let chatObj = await this.chatRepository.findOne({ where: { id: chatId } });

    // Clear the unread count in parent chat for the reading user
    if (chatObj) {
      const unreadCounts = chatObj.unreadCounts || {};
      unreadCounts[userId] = 0;
      chatObj.unreadCounts = unreadCounts;
      try {
        await this.chatRepository.save(chatObj);
      } catch (updateErr) {
        console.error(`Error clearing unread counts for user ${userId} in chat ${chatId}`, updateErr);
      }
    }

    try {
      const rawMsgs = await this.messageRepository.find({
        where: { chatId },
        order: { id: 'ASC' },
        take: limit,
      });
      
      // Update read status for the requesting user
      await Promise.all(rawMsgs.map(async (m) => {
        const readBy = m.readBy || [m.senderId];
        if (!readBy.includes(userId)) {
          readBy.push(userId);
          m.readBy = readBy;
          await this.messageRepository.save(m);
        }
      }));

      const msgs = rawMsgs.map((m) => {
        const readBy = m.readBy || [m.senderId];
        if (!readBy.includes(userId)) {
          readBy.push(userId);
        }
        return { ...m, readBy };
      });

      // Filter out system messages so they do not show up in the chat logs
      const nonSystemMsgs = msgs.filter((m) => m.senderId !== 'system' && m.senderId !== 'system-message');

      // Populate senderName, senderRole, and timestamp in memory
      const populated = await Promise.all(nonSystemMsgs.map(async (m) => {
        const user = await this.usersService.findById(m.senderId);
        return {
          ...m,
          senderName: user ? user.name : '알수없음',
          senderRole: user ? user.role : 'student',
          timestamp: m.createdAt,
        } as any;
      }));

      return populated;
    } catch (e) {
      console.error('Error fetching messages from PostgreSQL', e);
      return [];
    }
  }

  async createChat(dto: CreateChatDto): Promise<Chat> {
    const id = `c-${Date.now()}`;
    const type = dto.memberIds.length > 2 ? 'group' : 'direct';
    const name = dto.name || (type === 'group' ? '단체 채팅방' : '1:1 채팅');
    
    const unreadCounts: { [userId: string]: number } = {};
    dto.memberIds.forEach((mId) => {
      unreadCounts[mId] = 0;
    });

    const chat: Chat = {
      id,
      name,
      type,
      memberIds: dto.memberIds,
      lastMessage: '채팅방이 개설되었습니다.',
      lastMessageTime: formatTime(),
      unreadCount: 0,
      unreadCounts,
      customNames: {},
      workspace: dto.workspace,
    };

    return this.chatRepository.save(chat);
  }

  async updateCustomName(chatId: string, userId: string, customName: string): Promise<Chat> {
    const chat = await this.chatRepository.findOne({ where: { id: chatId } });
    if (!chat) throw new Error('Chat not found');

    const customNames = chat.customNames || {};
    customNames[userId] = customName;
    chat.customNames = customNames;

    return this.chatRepository.save(chat);
  }

  async leaveChat(chatId: string, userId: string): Promise<void> {
    const chat = await this.chatRepository.findOne({ where: { id: chatId } });
    if (!chat) return;

    chat.memberIds = chat.memberIds.filter(id => id !== userId);

    if (chat.memberIds.length === 0) {
      // Delete messages and chat if no members left
      await this.messageRepository.delete({ chatId });
      await this.voteRepository.delete({ chatId });
      await this.eventRepository.delete({ chatId });
      await this.chatRepository.delete({ id: chatId });
    } else {
      await this.chatRepository.save(chat);
    }
  }

  async sendMessage(
    chatId: string, 
    senderId: string, 
    content: string, 
    fileUrl?: string, 
    fileName?: string, 
    fileType?: string
  ): Promise<Message> {
    const user = await this.usersService.findById(senderId);
    const msg: Message = {
      id: `m-${Date.now()}`,
      chatId,
      senderId,
      content,
      createdAt: formatTime(),
      readBy: [senderId],
      fileUrl,
      fileName,
      fileType,
    };

    // Save message
    await this.messageRepository.save(msg);

    // Fetch parent chat to update last message & unreadCounts
    const chatData = await this.chatRepository.findOne({ where: { id: chatId } });
    if (chatData) {
      const unreadCounts = chatData.unreadCounts || {};
      const pushTokens: string[] = [];

      // Collect push tokens for other members
      await Promise.all(chatData.memberIds.map(async (mId) => {
        if (mId !== senderId) {
          unreadCounts[mId] = (unreadCounts[mId] || 0) + 1;
          const member = await this.usersService.findById(mId);
          if (member && member.pushToken) {
            pushTokens.push(member.pushToken);
          }
        } else {
          unreadCounts[mId] = 0;
        }
      }));

      chatData.lastMessage = content;
      chatData.lastMessageTime = msg.createdAt;
      chatData.unreadCounts = unreadCounts;
      await this.chatRepository.save(chatData);

      // Send push notification
      if (pushTokens.length > 0) {
        let chatName = chatData.name;
        if (chatData.type === 'direct') {
          chatName = user?.name || '사용자';
        }

        const msgBody = fileUrl ? (fileType === 'image' ? '(사진)' : '(파일)') : content;
        
        try {
          await this.pushService.broadcastNotice(
            pushTokens,
            chatName,
            msgBody.length > 30 ? msgBody.substring(0, 30) + '...' : msgBody,
            { chatId: chatData.id, type: 'chat' }
          );
        } catch (e) {
          console.error('Failed to send push notification', e);
        }
      }
    }

    // Trigger check for [공지], [긴급], [행사]
    try {
      const sender = await this.usersService.findById(senderId);
      if (sender && (sender.role === 'teacher' || sender.position === 'head' || sender.position === 'deputy')) {
        const trimmed = content.trim();
        const prefixMatch = trimmed.match(/^\[(공지|긴급|행사)\]/);
        if (prefixMatch) {
          const tag = prefixMatch[1] as '공지' | '긴급' | '행사';
          const rawText = trimmed.substring(prefixMatch[0].length).trim();
          const lines = rawText.split('\n');
          const title = lines[0] || `${tag}사항 안내`;
          const bodyContent = lines.slice(1).join('\n') || '';

          const today = new Date();
          const yyyy = today.getFullYear();
          const mm = (today.getMonth() + 1).toString().padStart(2, '0');
          const dd = today.getDate().toString().padStart(2, '0');
          const dateStr = `${yyyy}.${mm}.${dd}`;

          const newNotice = await this.schoolService.createNotice({
            id: `n-${Date.now()}`,
            tag,
            date: dateStr,
            title,
            content: bodyContent,
          });

          // FCM/Expo Push Notification to all users for the new notice
          const allUsers = await this.usersService.findAll();
          const noticePushTokens = allUsers.map(u => u.pushToken).filter(t => !!t) as string[];
          if (noticePushTokens.length > 0) {
            await this.pushService.broadcastNotice(
              noticePushTokens,
              `[새 공지사항] ${newNotice.title}`,
              newNotice.content.length > 30 ? newNotice.content.substring(0, 30) + '...' : newNotice.content,
              { noticeId: newNotice.id, type: 'notice' }
            );
          }
        }
      }
    } catch (err) {
      console.error('Failed to trigger auto notice registration', err);
    }

    // Populate sender details for return
    return {
      ...msg,
      senderName: user ? user.name : '알수없음',
      senderRole: user ? user.role : 'student',
      timestamp: msg.createdAt,
    } as any;
  }

  async createVote(chatId: string, creatorId: string, title: string, options: string[]): Promise<VoteEntity> {
    const chat = await this.chatRepository.findOne({ where: { id: chatId } });
    if (!chat) throw new Error('Chat not found');

    const creator = await this.usersService.findById(creatorId);
    
    // 권한 체크: 단체 채팅방일 경우 (direct 채팅방은 예외 없이 허용)
    if (chat.type === 'group') {
      const isAuthorized = creator?.isAdmin || creator?.role === 'teacher' || creator?.position === 'head' || creator?.position === 'deputy';
      if (!isAuthorized) {
        throw new Error('Unauthorized');
      }
    }

    const vote: VoteEntity = {
      id: `v-${Date.now()}`,
      chatId,
      title,
      options,
      creatorId,
      createdAt: formatTime(),
      closed: false,
      votes: {},
    };

    return this.voteRepository.save(vote);
  }

  async getVotes(chatId: string): Promise<VoteEntity[]> {
    return this.voteRepository.find({ where: { chatId } });
  }

  async participateVote(voteId: string, userId: string, optionIndex: number): Promise<VoteEntity> {
    const vote = await this.voteRepository.findOne({ where: { id: voteId } });
    if (!vote) throw new Error('Vote not found');
    if (vote.closed) throw new Error('Vote is closed');
    
    vote.votes = vote.votes || {};
    vote.votes[userId] = optionIndex;
    
    return this.voteRepository.save(vote);
  }

  async updateVote(voteId: string, userId: string, title: string, options: string[]): Promise<VoteEntity> {
    const vote = await this.voteRepository.findOne({ where: { id: voteId } });
    if (!vote) throw new Error('Vote not found');

    const chat = await this.chatRepository.findOne({ where: { id: vote.chatId } });
    const user = await this.usersService.findById(userId);

    if (chat?.type === 'group') {
      const isAuthorized = user?.isAdmin || user?.role === 'teacher' || user?.position === 'head' || user?.position === 'deputy';
      if (!isAuthorized) throw new Error('Unauthorized');
    } else {
      if (vote.creatorId !== userId) throw new Error('Unauthorized');
    }

    vote.title = title;
    vote.options = options;
    return this.voteRepository.save(vote);
  }

  async closeVote(voteId: string, userId: string): Promise<VoteEntity> {
    const vote = await this.voteRepository.findOne({ where: { id: voteId } });
    if (!vote) throw new Error('Vote not found');

    const chat = await this.chatRepository.findOne({ where: { id: vote.chatId } });
    const user = await this.usersService.findById(userId);

    if (chat?.type === 'group') {
      const isAuthorized = user?.isAdmin || user?.role === 'teacher' || user?.position === 'head' || user?.position === 'deputy';
      if (!isAuthorized) throw new Error('Unauthorized');
    } else {
      if (vote.creatorId !== userId) throw new Error('Unauthorized');
    }

    vote.closed = true;
    return this.voteRepository.save(vote);
  }

  async createEvent(chatId: string, creatorId: string, title: string, description: string, eventDate: string): Promise<ChatEventEntity> {
    const event: ChatEventEntity = {
      id: `e-${Date.now()}`,
      chatId,
      title,
      description,
      eventDate,
      creatorId,
      createdAt: formatTime(),
    };

    return this.eventRepository.save(event);
  }

  async getEvents(chatId: string): Promise<ChatEventEntity[]> {
    return this.eventRepository.find({ where: { chatId } });
  }
}
