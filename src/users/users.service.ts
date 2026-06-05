// src/users/users.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { User } from './users.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private users: User[] = [];

  async create(dto: CreateUserDto): Promise<User> {
    const exists = this.users.find((u) => u.email === dto.email);
    if (exists) {
      throw new ConflictException('User already exists');
    }

    const hashed = await bcrypt.hash(dto.password, 10);

    const user: User = {
      id: `u-${Date.now()}`,
      email: dto.email,
      password: hashed,
      name: dto.name,
      phone: dto.phone,
      role: dto.role,
      workspace: dto.workspace,
      isApproved: dto.isApproved ?? false, // 기본: 승인 대기
      isAdmin: dto.isAdmin ?? false,
      statusMessage: dto.isApproved ? 'DYMS 접속 완료!' : 'DYMS 접속 대기중',
    };

    this.users.push(user);
    return user;
  }

  findByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email === email);
  }

  findById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  async validateUserPassword(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = this.findByEmail(email);
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return null;
    return user;
  }

  // 관리자: 승인 대기 유저 목록
  findPending(): User[] {
    return this.users.filter((u) => !u.isApproved);
  }

  // 관리자: 특정 유저 승인
  approve(id: string): User {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isApproved = true;
    user.statusMessage = 'DYMS 접속 완료!';
    return user;
  }
}
