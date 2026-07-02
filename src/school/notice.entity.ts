import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('notices')
export class NoticeEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  tag!: string; // '긴급' | '행사' | '공지'

  @Column()
  date!: string;

  @Column()
  title!: string;

  @Column()
  content!: string;

  @Column({ nullable: true })
  linkUrl?: string;
}
