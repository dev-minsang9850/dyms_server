import { Entity, PrimaryColumn, Column } from 'typeorm';

export type ChatType = 'direct' | 'group';

@Entity('chats')
export class Chat {
  @PrimaryColumn()
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'varchar' })
  type!: ChatType;

  @Column('text', { array: true, default: '{}' })
  memberIds!: string[];

  @Column({ nullable: true })
  lastMessage?: string;

  @Column({ nullable: true })
  lastMessageTime?: string;

  @Column({ default: 0 })
  unreadCount!: number;

  @Column('jsonb', { nullable: true })
  unreadCounts?: { [userId: string]: number };

  @Column({ nullable: true })
  workspace?: string;
}
