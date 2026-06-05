// src/users/users.service.ts
import { Injectable, ConflictException, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { User, WorkspaceName } from './users.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger('UsersService');

  constructor(private readonly firebaseService: FirebaseService) {}

  async onModuleInit() {
    // Seed default users if users collection is empty
    try {
      const all = await this.findAll();
      if (all.length === 0) {
        this.logger.log('No users found in database. Seeding default accounts...');
        
        // Admin
        await this.createRaw({
          email: 'admin@dy.hs.kr',
          password: '123456',
          name: '관리자',
          phone: '010-1111-1111',
          role: 'teacher',
          workspace: 'DY@Software',
          isApproved: true,
          isAdmin: true,
        });

        // Student (Approved)
        await this.createRaw({
          email: 'deodux@gmail.com',
          password: '123456',
          name: '홍길동',
          phone: '010-2222-2222',
          role: 'student',
          workspace: 'DY@WEB',
          isApproved: true,
          isAdmin: false,
        });

        // Teacher (Approved)
        await this.createRaw({
          email: 'teacher.lee@dy.hs.kr',
          password: '123456',
          name: '이민상',
          phone: '010-3333-3333',
          role: 'teacher',
          workspace: 'DY@Software',
          isApproved: true,
          isAdmin: false,
        });

        // Student (Pending)
        await this.createRaw({
          email: 'pending.kim@gmail.com',
          password: '123456',
          name: '김영희',
          phone: '010-4444-4444',
          role: 'student',
          isApproved: false,
          isAdmin: false,
        });

        // Student (Pending)
        await this.createRaw({
          email: 'pending.park@gmail.com',
          password: '123456',
          name: '박철수',
          phone: '010-5555-5555',
          role: 'student',
          isApproved: false,
          isAdmin: false,
        });

        this.logger.log('Default accounts seeded successfully.');
      } else {
        this.logger.log(`Existing users found: ${all.length}. Skipping seeding.`);
      }
    } catch (e) {
      this.logger.error('Failed to seed default users', e);
    }
  }

  private getCollection() {
    return this.firebaseService.db?.collection('users');
  }

  async findAll(): Promise<User[]> {
    if (this.firebaseService.isFallback()) {
      return this.firebaseService.fallbackDb.users;
    }
    const snapshot = await this.getCollection()!.get();
    return snapshot.docs.map((doc) => doc.data() as User);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const all = await this.findAll();
    return all.find((u) => u.email === email);
  }

  async findById(id: string): Promise<User | undefined> {
    const all = await this.findAll();
    return all.find((u) => u.id === id);
  }

  private async createRaw(dto: CreateUserDto & { isApproved: boolean; isAdmin: boolean }): Promise<User> {
    const hashed = await bcrypt.hash(dto.password, 10);
    const user: User = {
      id: `u-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      email: dto.email,
      password: hashed,
      name: dto.name,
      phone: dto.phone,
      role: dto.role,
      workspace: dto.workspace,
      isApproved: dto.isApproved,
      isAdmin: dto.isAdmin,
      statusMessage: dto.isApproved ? 'DYMS 접속 완료!' : 'DYMS 접속 대기중',
    };

    if (this.firebaseService.isFallback()) {
      this.firebaseService.fallbackDb.users.push(user);
      return user;
    }

    await this.getCollection()!.doc(user.id).set(user);
    return user;
  }

  async create(dto: CreateUserDto): Promise<User> {
    const exists = await this.findByEmail(dto.email);
    if (exists) {
      throw new ConflictException('User already exists');
    }
    return this.createRaw({
      ...dto,
      isApproved: dto.isApproved ?? false,
      isAdmin: dto.isAdmin ?? false,
    });
  }

  async validateUserPassword(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return null;
    return user;
  }

  async findPending(): Promise<User[]> {
    const all = await this.findAll();
    return all.filter((u) => !u.isApproved);
  }

  async approve(id: string, workspace: WorkspaceName): Promise<User> {
    const all = await this.findAll();
    const user = all.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isApproved = true;
    user.workspace = workspace;
    user.statusMessage = 'DYMS 접속 완료!';

    if (!this.firebaseService.isFallback()) {
      await this.getCollection()!.doc(id).update({
        isApproved: true,
        workspace,
        statusMessage: user.statusMessage,
      });
    }

    return user;
  }

  async updateStatusMessage(id: string, statusMessage: string): Promise<User> {
    const all = await this.findAll();
    const user = all.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.statusMessage = statusMessage;

    if (!this.firebaseService.isFallback()) {
      await this.getCollection()!.doc(id).update({
        statusMessage,
      });
    }

    return user;
  }

  async updateWorkspace(id: string, workspace: WorkspaceName): Promise<User> {
    const all = await this.findAll();
    const user = all.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.workspace = workspace;

    if (!this.firebaseService.isFallback()) {
      await this.getCollection()!.doc(id).update({
        workspace,
      });
    }

    return user;
  }
}
