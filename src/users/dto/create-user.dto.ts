// src/users/dto/create-user.dto.ts
import { UserRole } from '../users.entity';

export class CreateUserDto {
  email!: string;
  password!: string;
  name!: string;
  phone!: string;
  role!: UserRole;
}
