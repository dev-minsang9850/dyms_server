// src/users/user.entity.ts
export type UserRole = 'student' | 'teacher';

export class User {
  id!: string;
  email!: string;
  password!: string; // 해시된 비밀번호
  name!: string;
  phone!: string;
  role!: UserRole;
  statusMessage?: string;
}
