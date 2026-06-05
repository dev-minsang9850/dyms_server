// src/auth/dto/auth-response.dto.ts
import { UserRole, WorkspaceName } from '../../users/users.entity';

export class AuthUserResponseDto {
  id!: string;
  name!: string;
  email!: string;
  phone!: string;
  role!: UserRole;
  workspace!: WorkspaceName;
  isApproved!: boolean;
  isAdmin!: boolean;
  statusMessage?: string;
}

export class LoginResponseDto {
  user!: AuthUserResponseDto;
  accessToken!: string;
}

export class RegisterResponseDto {
  user!: AuthUserResponseDto;
  message!: string;
}
