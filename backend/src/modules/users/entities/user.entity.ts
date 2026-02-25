import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { Board } from '../../boards/entities/board.entity';
import { BoardMember } from '../../boards/entities/board-member.entity';
import { Card } from '../../cards/entities/card.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Board, (board) => board.owner)
  ownedBoards: Board[];

  @OneToMany(() => BoardMember, (member) => member.user)
  boardMemberships: BoardMember[];

  @ManyToMany(() => Card, (card) => card.assignedUsers)
  assignedCards: Card[];
}
