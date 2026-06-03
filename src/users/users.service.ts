// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { User, UserRole } from './users.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private users: User[] = [];

  async create(dto: CreateUserDto): Promise<User> {
    const exists = this.users.find((u) => u.email === dto.email);
    if (exists) {
      throw new Error('User already exists');
    }

    const hashed = await bcrypt.hash(dto.password, 10);

    const user: User = {
      id: `u-${Date.now()}`,
      email: dto.email,
      password: hashed,
      name: dto.name,
      phone: dto.phone,
      role: dto.role,
      statusMessage: 'DYMS 접속 완료!',
    };

    this.users.push(user);
    return user;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.users.find((u) => u.email === email);
  }

  async findById(id: string): Promise<User | undefined> {
    return this.users.find((u) => u.id === id);
  }

  async validateUserPassword(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return null;
    return user;
  }
}
