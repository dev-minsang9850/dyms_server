// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt-payload.interface';
import { CreateUserDto } from '../users/dto/create-user.dto';
//import { UserRole, WorkspaceName } from '../users/users.entity';
import {
  AuthUserResponseDto,
  LoginResponseDto,
  RegisterResponseDto,
} from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<RegisterResponseDto> {
    const toCreate: CreateUserDto = {
      email: dto.email,
      password: dto.password,
      name: dto.name,
      phone: dto.phone,
      role: dto.role,
      workspace: dto.workspace,
      isApproved: false,
      isAdmin: false,
    };

    const user = await this.usersService.create(toCreate);

    const safeUser: AuthUserResponseDto = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      workspace: user.workspace,
      isApproved: user.isApproved,
      isAdmin: user.isAdmin,
      statusMessage: user.statusMessage,
    };

    return {
      user: safeUser,
      message:
        '회원가입 신청이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.',
    };
  }

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.usersService.validateUserPassword(
      dto.email,
      dto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isApproved) {
      throw new UnauthorizedException('관리자 승인 후 로그인 가능합니다.');
    }

    const token = this.signToken(user.id, user.email);

    const safeUser: AuthUserResponseDto = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      workspace: user.workspace,
      isApproved: user.isApproved,
      isAdmin: user.isAdmin,
      statusMessage: user.statusMessage,
    };

    return { user: safeUser, accessToken: token };
  }

  private signToken(userId: string, email: string): string {
    const payload: JwtPayload = { sub: userId, email };
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'dev-secret',
      expiresIn: '7d',
    });
  }
}
