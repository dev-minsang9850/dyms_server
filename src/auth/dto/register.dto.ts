// src/auth/dto/register.dto.ts
import { UserRole, WorkspaceName } from '../../users/users.entity';

export class RegisterDto {
  email!: string;
  password!: string;
  name!: string;
  phone!: string;
  role!: UserRole;
  workspace?: WorkspaceName;
  grade?: number;
  class?: number;
  number?: number;
}
