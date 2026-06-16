import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('workspaces')
export class WorkspaceEntity {
  @PrimaryColumn()
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column()
  ownerEmail!: string;

  @Column('text', { array: true, default: '{}' })
  memberEmails!: string[];
}
