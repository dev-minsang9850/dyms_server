// src/users/users.entity.ts

// 1. 타입 먼저 선언
export type UserRole = 'student' | 'teacher';

export type WorkspaceName =
  | 'DY@Software'
  | 'DY@InfoSec'
  | 'DY@AI'
  | 'DY@WEB'
  | 'DY@Design';

export type UserPosition = 'none' | 'head' | 'deputy';

import { Entity, PrimaryColumn, Column } from 'typeorm';

// 2. 그 다음에 User 클래스 선언
@Entity('users')
export class User {
  @PrimaryColumn()
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  name!: string;

  @Column()
  phone!: string;

  @Column({ type: 'varchar' })
  role!: UserRole; // ✅ 여기서 UserRole 사용

  @Column({ type: 'varchar', nullable: true })
  workspace?: WorkspaceName | null;

  @Column({ default: false })
  isApproved!: boolean;

  @Column({ default: false })
  isAdmin!: boolean;

  @Column({ nullable: true })
  statusMessage?: string;

  @Column({ nullable: true })
  grade?: number;

  @Column({ nullable: true })
  class?: number;

  @Column({ nullable: true })
  number?: number;

  @Column({ type: 'varchar', nullable: true, default: 'none' })
  position?: UserPosition;

  @Column({ nullable: true })
  profileImage?: string;

  @Column({ nullable: true })
  pushToken?: string;
}
