// src/auth/dto/register.dto.ts
import { UserRole } from '../../users/users.entity';

export class RegisterDto {
  email!: string;
  password!: string;
  name!: string;
  phone!: string;
  role!: UserRole; // string 말고 UserRole
}
