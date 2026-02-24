import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board } from '../entities/board.entity';
import { BoardMember, BoardRole } from '../entities/board-member.entity';

export enum BoardPermission {
  VIEW = 'view',
  EDIT = 'edit',
  DELETE = 'delete',
  MANAGE_MEMBERS = 'manage_members',
  INVITE_MEMBERS = 'invite_members',
}

@Injectable()
export class BoardPermissionService {
  constructor(
    @InjectRepository(Board)
    private boardRepository: Repository<Board>,
    @InjectRepository(BoardMember)
    private boardMemberRepository: Repository<BoardMember>,
  ) {}

  async canViewBoard(userId: string, boardId: string): Promise<boolean> {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    if (!board) {
      return false;
    }

    if (board.ownerId === userId) {
      return true;
    }

    const member = await this.boardMemberRepository.findOne({
      where: { boardId, userId },
    });

    return !!member;
  }

  async canEditBoard(userId: string, boardId: string): Promise<boolean> {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    if (!board) {
      return false;
    }

    if (board.ownerId === userId) {
      return true;
    }

    const member = await this.boardMemberRepository.findOne({
      where: { boardId, userId },
    });

    return member?.role === BoardRole.MODERATOR;
  }

  async canDeleteBoard(userId: string, boardId: string): Promise<boolean> {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    if (!board) {
      return false;
    }

    return board.ownerId === userId;
  }

  async canManageMembers(userId: string, boardId: string): Promise<boolean> {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    if (!board) {
      return false;
    }

    return board.ownerId === userId;
  }

  async canInviteMembers(userId: string, boardId: string): Promise<boolean> {
    return this.canManageMembers(userId, boardId);
  }

  async checkPermission(
    userId: string,
    boardId: string,
    permission: BoardPermission,
  ): Promise<boolean> {
    switch (permission) {
      case BoardPermission.VIEW:
        return this.canViewBoard(userId, boardId);
      case BoardPermission.EDIT:
        return this.canEditBoard(userId, boardId);
      case BoardPermission.DELETE:
        return this.canDeleteBoard(userId, boardId);
      case BoardPermission.MANAGE_MEMBERS:
        return this.canManageMembers(userId, boardId);
      case BoardPermission.INVITE_MEMBERS:
        return this.canInviteMembers(userId, boardId);
      default:
        return false;
    }
  }

  async getUserRole(
    userId: string,
    boardId: string,
  ): Promise<BoardRole | 'owner' | null> {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    if (!board) {
      return null;
    }

    if (board.ownerId === userId) {
      return 'owner';
    }

    const member = await this.boardMemberRepository.findOne({
      where: { boardId, userId },
    });

    return member?.role || null;
  }
}
