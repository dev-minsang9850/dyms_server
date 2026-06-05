// src/users/dto/create-user.dto.ts
import { UserRole, WorkspaceName } from '../users.entity';

export class CreateUserDto {
  email!: string;
  password!: string;
  name!: string;
  phone!: string;
  role!: UserRole;
  workspace!: WorkspaceName;
  isApproved?: boolean;
  isAdmin?: boolean;
}
