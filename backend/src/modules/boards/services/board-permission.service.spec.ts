import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BoardPermissionService,
  BoardPermission,
} from './board-permission.service';
import { BoardMember, BoardRole } from '../entities/board-member.entity';
import { Board } from '../entities/board.entity';

describe('BoardPermissionService', () => {
  let service: BoardPermissionService;

  const mockBoardRepository = {
    findOne: jest.fn(),
  };

  const mockBoardMemberRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardPermissionService,
        {
          provide: getRepositoryToken(Board),
          useValue: mockBoardRepository,
        },
        {
          provide: getRepositoryToken(BoardMember),
          useValue: mockBoardMemberRepository,
        },
      ],
    }).compile();

    service = module.get<BoardPermissionService>(BoardPermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserRole', () => {
    it('should return owner role for board owner', async () => {
      const mockBoard = { id: 'board-1', ownerId: 'user-1' };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);

      const role = await service.getUserRole('user-1', 'board-1');

      expect(role).toBe(BoardRole.OWNER);
      expect(mockBoardRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'board-1' },
      });
    });

    it('should return member role for board member', async () => {
      const mockBoard = { id: 'board-1', ownerId: 'user-2' };
      const mockMember = {
        id: 'member-1',
        boardId: 'board-1',
        userId: 'user-1',
        role: BoardRole.MODERATOR,
      };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockBoardMemberRepository.findOne.mockResolvedValue(mockMember);

      const role = await service.getUserRole('user-1', 'board-1');

      expect(role).toBe(BoardRole.MODERATOR);
      expect(mockBoardMemberRepository.findOne).toHaveBeenCalledWith({
        where: { boardId: 'board-1', userId: 'user-1' },
      });
    });

    it('should return null for non-member', async () => {
      const mockBoard = { id: 'board-1', ownerId: 'user-2' };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockBoardMemberRepository.findOne.mockResolvedValue(null);

      const role = await service.getUserRole('user-3', 'board-1');

      expect(role).toBeNull();
    });

    it('should return null if board not found', async () => {
      mockBoardRepository.findOne.mockResolvedValue(null);

      const role = await service.getUserRole('user-1', 'non-existent-board');

      expect(role).toBeNull();
    });
  });

  describe('canViewBoard', () => {
    it('should return true for owner', async () => {
      const mockBoard = { id: 'board-1', ownerId: 'user-1' };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);

      const result = await service.canViewBoard('user-1', 'board-1');

      expect(result).toBe(true);
    });

    it('should return true for moderator', async () => {
      const mockBoard = { id: 'board-1', ownerId: 'user-2' };
      const mockMember = {
        id: 'member-1',
        boardId: 'board-1',
        userId: 'user-1',
        role: BoardRole.MODERATOR,
      };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockBoardMemberRepository.findOne.mockResolvedValue(mockMember);

      const result = await service.canViewBoard('user-1', 'board-1');

      expect(result).toBe(true);
    });

    it('should return true for visitor', async () => {
      const mockBoard = { id: 'board-1', ownerId: 'user-2' };
      const mockMember = {
        id: 'member-1',
        boardId: 'board-1',
        userId: 'user-1',
        role: BoardRole.VISITOR,
      };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockBoardMemberRepository.findOne.mockResolvedValue(mockMember);

      const result = await service.canViewBoard('user-1', 'board-1');

      expect(result).toBe(true);
    });

    it('should return false for non-member', async () => {
      const mockBoard = { id: 'board-1', ownerId: 'user-2' };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockBoardMemberRepository.findOne.mockResolvedValue(null);

      const result = await service.canViewBoard('user-3', 'board-1');

      expect(result).toBe(false);
    });
  });

  describe('canEditBoard', () => {
    it('should return true for owner', async () => {
      const mockBoard = { id: 'board-1', ownerId: 'user-1' };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);

      const result = await service.canEditBoard('user-1', 'board-1');

      expect(result).toBe(true);
    });

    it('should return true for moderator', async () => {
      const mockBoard = { id: 'board-1', ownerId: 'user-2' };
      const mockMember = {
        id: 'member-1',
        boardId: 'board-1',
        userId: 'user-1',
        role: BoardRole.MODERATOR,
      };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockBoardMemberRepository.findOne.mockResolvedValue(mockMember);

      const result = await service.canEditBoard('user-1', 'board-1');

      expect(result).toBe(true);
    });

    it('should return false for visitor', async () => {
      const mockBoard = { id: 'board-1', ownerId: 'user-2' };
      const mockMember = {
        id: 'member-1',
        boardId: 'board-1',
        userId: 'user-1',
        role: BoardRole.VISITOR,
      };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockBoardMemberRepository.findOne.mockResolvedValue(mockMember);

      const result = await service.canEditBoard('user-1', 'board-1');

      expect(result).toBe(false);
    });

    it('should return false for non-member', async () => {
      const mockBoard = { id: 'board-1', ownerId: 'user-2' };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockBoardMemberRepository.findOne.mockResolvedValue(null);

      const result = await service.canEditBoard('user-3', 'board-1');

      expect(result).toBe(false);
    });
  });

  describe('canDeleteBoard', () => {
    it('should return true for owner', async () => {
      const mockBoard = { id: 'board-1', ownerId: 'user-1' };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);

      const result = await service.canDeleteBoard('user-1', 'board-1');

      expect(result).toBe(true);
    });

    it('should return false for moderator', async () => {
      const mockBoard = { id: 'board-1', ownerId: 'user-2' };
      const mockMember = {
        id: 'member-1',
        boardId: 'board-1',
        userId: 'user-1',
        role: BoardRole.MODERATOR,
      };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockBoardMemberRepository.findOne.mockResolvedValue(mockMember);

      const result = await service.canDeleteBoard('user-1', 'board-1');

      expect(result).toBe(false);
    });

    it('should return false for visitor', async () => {
      const mockBoard = { id: 'board-1', ownerId: 'user-2' };
      const mockMember = {
        id: 'member-1',
        boardId: 'board-1',
        userId: 'user-1',
        role: BoardRole.VISITOR,
      };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockBoardMemberRepository.findOne.mockResolvedValue(mockMember);

      const result = await service.canDeleteBoard('user-1', 'board-1');

      expect(result).toBe(false);
    });
  });

  describe('canManageMembers', () => {
    it('should return true for owner', async () => {
      const mockBoard = { id: 'board-1', ownerId: 'user-1' };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);

      const result = await service.canManageMembers('user-1', 'board-1');

      expect(result).toBe(true);
    });

    it('should return false for moderator', async () => {
      const mockBoard = { id: 'board-1', ownerId: 'user-2' };
      const mockMember = {
        id: 'member-1',
        boardId: 'board-1',
        userId: 'user-1',
        role: BoardRole.MODERATOR,
      };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockBoardMemberRepository.findOne.mockResolvedValue(mockMember);

      const result = await service.canManageMembers('user-1', 'board-1');

      expect(result).toBe(false);
    });

    it('should return false for visitor', async () => {
      const mockBoard = { id: 'board-1', ownerId: 'user-2' };
      const mockMember = {
        id: 'member-1',
        boardId: 'board-1',
        userId: 'user-1',
        role: BoardRole.VISITOR,
      };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockBoardMemberRepository.findOne.mockResolvedValue(mockMember);

      const result = await service.canManageMembers('user-1', 'board-1');

      expect(result).toBe(false);
    });
  });

  describe('canInviteMembers', () => {
    it('should return true for owner', async () => {
      const mockBoard = { id: 'board-1', ownerId: 'user-1' };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);

      const result = await service.canInviteMembers('user-1', 'board-1');

      expect(result).toBe(true);
    });

    it('should return false for moderator (only owner can invite)', async () => {
      const mockBoard = { id: 'board-1', ownerId: 'user-2' };
      const mockMember = {
        id: 'member-1',
        boardId: 'board-1',
        userId: 'user-1',
        role: BoardRole.MODERATOR,
      };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockBoardMemberRepository.findOne.mockResolvedValue(mockMember);

      const result = await service.canInviteMembers('user-1', 'board-1');

      expect(result).toBe(false);
    });

    it('should return false for visitor', async () => {
      const mockBoard = { id: 'board-1', ownerId: 'user-2' };
      const mockMember = {
        id: 'member-1',
        boardId: 'board-1',
        userId: 'user-1',
        role: BoardRole.VISITOR,
      };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockBoardMemberRepository.findOne.mockResolvedValue(mockMember);

      const result = await service.canInviteMembers('user-1', 'board-1');

      expect(result).toBe(false);
    });
  });

  describe('checkPermission', () => {
    it('should check VIEW permission correctly', async () => {
      const mockBoard = { id: 'board-1', ownerId: 'user-1' };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);

      const result = await service.checkPermission(
        'user-1',
        'board-1',
        BoardPermission.VIEW,
      );

      expect(result).toBe(true);
    });

    it('should check EDIT permission correctly', async () => {
      const mockBoard = { id: 'board-1', ownerId: 'user-1' };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);

      const result = await service.checkPermission(
        'user-1',
        'board-1',
        BoardPermission.EDIT,
      );

      expect(result).toBe(true);
    });

    it('should check DELETE permission correctly', async () => {
      const mockBoard = { id: 'board-1', ownerId: 'user-1' };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);

      const result = await service.checkPermission(
        'user-1',
        'board-1',
        BoardPermission.DELETE,
      );

      expect(result).toBe(true);
    });

    it('should check MANAGE_MEMBERS permission correctly', async () => {
      const mockBoard = { id: 'board-1', ownerId: 'user-1' };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);

      const result = await service.checkPermission(
        'user-1',
        'board-1',
        BoardPermission.MANAGE_MEMBERS,
      );

      expect(result).toBe(true);
    });

    it('should check INVITE_MEMBERS permission correctly', async () => {
      const mockBoard = { id: 'board-1', ownerId: 'user-1' };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);

      const result = await service.checkPermission(
        'user-1',
        'board-1',
        BoardPermission.INVITE_MEMBERS,
      );

      expect(result).toBe(true);
    });

    it('should return false for unknown permission', async () => {
      const mockBoard = { id: 'board-1', ownerId: 'user-1' };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);

      const result = await service.checkPermission(
        'user-1',
        'board-1',
        'UNKNOWN_PERMISSION' as BoardPermission,
      );

      expect(result).toBe(false);
    });
  });
});
