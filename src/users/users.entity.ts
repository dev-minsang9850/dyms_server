// src/users/users.entity.ts

// 1. 타입 먼저 선언
export type UserRole = 'student' | 'teacher';

export type WorkspaceName =
  | 'DY@Software'
  | 'DY@InfoSec'
  | 'DY@AI'
  | 'DY@WEB'
  | 'DY@Design';

// 2. 그 다음에 User 클래스 선언
export class User {
  id!: string;
  email!: string;
  password!: string;
  name!: string;
  phone!: string;
  role!: UserRole; // ✅ 여기서 UserRole 사용
  workspace?: WorkspaceName;
  isApproved!: boolean;
  isAdmin!: boolean;
  statusMessage?: string;
}
