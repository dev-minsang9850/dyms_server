import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('chat_events')
export class ChatEventEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  chatId!: string;

  @Column()
  title!: string;

  @Column()
  description!: string;

  @Column()
  eventDate!: string;

  @Column()
  creatorId!: string;

  @Column()
  createdAt!: string;
}
