import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('votes')
export class VoteEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  chatId!: string;

  @Column()
  title!: string;

  @Column('text', { array: true, default: '{}' })
  options!: string[];

  @Column()
  creatorId!: string;

  @Column()
  createdAt!: string;

  @Column({ default: false })
  closed!: boolean;

  @Column('jsonb', { default: '{}' })
  votes!: { [userId: string]: number };
}
