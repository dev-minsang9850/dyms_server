// src/users/dto/create-user.dto.ts
import { UserRole } from '../users.entity'; // users.entity.ts 기준

export class CreateUserDto {
  email!: string;
  password!: string;
  name!: string;
  phone!: string;
  role!: UserRole;
}
