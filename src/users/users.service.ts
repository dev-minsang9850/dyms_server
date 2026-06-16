// src/users/users.service.ts
import { Injectable, ConflictException, NotFoundException, OnModuleInit, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, WorkspaceName, UserPosition } from './users.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger('UsersService');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;
      
      if (!adminEmail || !adminPassword) {
        this.logger.error('ADMIN_EMAIL or ADMIN_PASSWORD is not set in environment variables! Admin seeding skipped.');
        return;
      }
      
      const adminUser = await this.findByEmail(adminEmail);
      if (!adminUser) {
        this.logger.log(`Admin account (${adminEmail}) not found. Seeding admin account...`);
        await this.createRaw({
          email: adminEmail,
          password: adminPassword,
          name: '관리자',
          phone: '010-1111-1111',
          role: 'teacher',
          workspace: 'DY@Software',
          isApproved: true,
          isAdmin: true,
          position: 'head',
        });
        this.logger.log(`Default administrator account (${adminEmail}) seeded successfully.`);
      } else {
        // Enforce administrative privileges in case they were lost or registered with low permissions
        if (!adminUser.isAdmin || !adminUser.isApproved) {
          this.logger.log(`Enforcing administrative privileges for (${adminEmail})...`);
          adminUser.isAdmin = true;
          adminUser.isApproved = true;
          adminUser.position = 'head';
          await this.userRepository.save(adminUser);
        }
        this.logger.log(`Admin account (${adminEmail}) already exists. Skipping admin seeding.`);
      }
    } catch (e) {
      this.logger.error('Failed to seed default users', e);
    }
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.userRepository.findOne({ where: { email } });
    return user || undefined;
  }

  async findById(id: string): Promise<User | undefined> {
    const user = await this.userRepository.findOne({ where: { id } });
    return user || undefined;
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
      grade: dto.grade,
      class: dto.class,
      number: dto.number,
      position: dto.position ?? 'none',
    };

    return this.userRepository.save(user);
  }

  async create(dto: CreateUserDto): Promise<User> {
    const exists = await this.findByEmail(dto.email);
    if (exists) {
      throw new ConflictException('User already exists');
    }

    // 이름 검증
    if (dto.name !== undefined) {
      const nameRegex = /^[a-zA-Z가-힣\s]+$/;
      if (!nameRegex.test(dto.name)) {
        throw new BadRequestException('이름에는 영문, 한글, 공백만 입력할 수 있으며 특수기호나 숫자는 포함될 수 없습니다.');
      }
    }

    // 전화번호 검증 및 포맷 정규화
    let phone = dto.phone;
    if (phone !== undefined) {
      const digits = phone.replace(/\D/g, '');
      const phoneRegex = /^010\d{7,8}$/;
      if (!phoneRegex.test(digits)) {
        throw new BadRequestException('유효하지 않은 전화번호 형식입니다. 010으로 시작하는 10~11자리 숫자여야 합니다.');
      }
      if (digits.length === 11) {
        phone = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
      } else {
        phone = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
      }
    }

    // 학생 정보 범위 검증
    if (dto.role === 'student') {
      if (dto.grade !== undefined && dto.grade !== null) {
        const g = Number(dto.grade);
        if (isNaN(g) || g < 1 || g > 3) {
          throw new BadRequestException('학년은 1에서 3 사이의 숫자여야 합니다.');
        }
      }
      if (dto.class !== undefined && dto.class !== null) {
        const c = Number(dto.class);
        if (isNaN(c) || c < 1 || c > 9) {
          throw new BadRequestException('반은 1에서 9 사이의 숫자여야 합니다.');
        }
      }
      if (dto.number !== undefined && dto.number !== null) {
        const n = Number(dto.number);
        if (isNaN(n) || n < 1 || n > 99) {
          throw new BadRequestException('번호는 1에서 99 사이의 숫자여야 합니다.');
        }
      }
    }

    return this.createRaw({
      ...dto,
      phone,
      isApproved: dto.isApproved ?? false,
      isAdmin: dto.isAdmin ?? false,
      grade: dto.grade,
      class: dto.class,
      number: dto.number,
      position: dto.position ?? 'none',
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
    return this.userRepository.find({ where: { isApproved: false } });
  }

  async approve(id: string, workspace: WorkspaceName): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isApproved = true;
    user.workspace = workspace;
    user.statusMessage = 'DYMS 접속 완료!';

    return this.userRepository.save(user);
  }

  async updateStatusMessage(id: string, statusMessage: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.statusMessage = statusMessage;
    return this.userRepository.save(user);
  }

  async updatePushToken(id: string, pushToken: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.pushToken = pushToken;
    return this.userRepository.save(user);
  }

  async updateWorkspace(id: string, workspace: WorkspaceName): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.workspace = workspace;
    return this.userRepository.save(user);
  }

  async findByWorkspace(workspace: WorkspaceName): Promise<User[]> {
    return this.userRepository.find({
      where: {
        workspace,
        isApproved: true,
      },
    });
  }

  async updatePosition(id: string, position: UserPosition): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.position = position;
    return this.userRepository.save(user);
  }

  async updatePassword(id: string, password: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const hashed = await bcrypt.hash(password, 10);
    user.password = hashed;
    return this.userRepository.save(user);
  }

  async updateProfile(
    id: string,
    data: {
      name?: string;
      phone?: string;
      grade?: number;
      class?: number;
      number?: number;
      password?: string;
      profileImage?: string;
    },
  ): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (data.name !== undefined) {
      const nameRegex = /^[a-zA-Z가-힣\s]+$/;
      if (!nameRegex.test(data.name)) {
        throw new BadRequestException('이름에는 영문, 한글, 공백만 입력할 수 있으며 특수기호나 숫자는 포함될 수 없습니다.');
      }
      user.name = data.name;
    }
    if (data.phone !== undefined) {
      const digits = data.phone.replace(/\D/g, '');
      const phoneRegex = /^010\d{7,8}$/;
      if (!phoneRegex.test(digits)) {
        throw new BadRequestException('유효하지 않은 전화번호 형식입니다. 010으로 시작하는 10~11자리 숫자여야 합니다.');
      }
      if (digits.length === 11) {
        user.phone = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
      } else {
        user.phone = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
      }
    }
    
    if (data.profileImage !== undefined) {
      user.profileImage = data.profileImage;
    }

    if (user.role === 'student') {
      if (data.grade !== undefined && data.grade !== null) {
        const g = Number(data.grade);
        if (isNaN(g) || g < 1 || g > 3) {
          throw new BadRequestException('학년은 1에서 3 사이의 숫자여야 합니다.');
        }
        user.grade = data.grade;
      }
      if (data.class !== undefined && data.class !== null) {
        const c = Number(data.class);
        if (isNaN(c) || c < 1 || c > 9) {
          throw new BadRequestException('반은 1에서 9 사이의 숫자여야 합니다.');
        }
        user.class = data.class;
      }
      if (data.number !== undefined && data.number !== null) {
        const n = Number(data.number);
        if (isNaN(n) || n < 1 || n > 99) {
          throw new BadRequestException('번호는 1에서 99 사이의 숫자여야 합니다.');
        }
        user.number = data.number;
      }
    }
    if (data.password !== undefined && data.password.trim() !== '') {
      const hashed = await bcrypt.hash(data.password, 10);
      user.password = hashed;
    }

    return this.userRepository.save(user);
  }

  async delete(id: string): Promise<{ success: boolean }> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userRepository.delete(id);
    return { success: true };
  }

  async findIdByNameAndPhone(name: string, phone: string): Promise<string | null> {
    const user = await this.userRepository.findOne({ where: { name, phone } });
    return user ? user.email : null;
  }

  async resetPasswordByEmailNamePhone(email: string, name: string, phone: string): Promise<string | null> {
    const user = await this.userRepository.findOne({ where: { email, name, phone } });
    if (!user) return null;

    const tempPassword = Math.random().toString(36).substring(2, 10);
    const hashed = await bcrypt.hash(tempPassword, 10);
    user.password = hashed;

    await this.userRepository.save(user);
    return tempPassword;
  }
}
