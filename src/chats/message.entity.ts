import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('messages')
export class Message {
  @PrimaryColumn()
  id!: string;

  @Column()
  chatId!: string;

  @Column()
  senderId!: string;

  @Column()
  content!: string;

  @Column()
  createdAt!: string;

  @Column('text', { array: true, default: '{}' })
  readBy!: string[];

  @Column({ nullable: true })
  fileUrl?: string;

  @Column({ nullable: true })
  fileName?: string;

  @Column({ nullable: true })
  fileType?: string; // 'image' | 'video' | 'file'
}

