// src/users/users.entity.ts
export type UserRole = 'student' | 'teacher';

export class User {
  id!: string;
  email!: string;
  password!: string;
  name!: string;
  phone!: string;
  role!: UserRole;
  statusMessage?: string;
}
