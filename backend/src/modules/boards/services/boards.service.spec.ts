import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { BoardsService } from './boards.service';
import { Board } from '../entities/board.entity';
import { BoardMember } from '../entities/board-member.entity';
import { CreateBoardDto } from '../dtos/create-board.dto';
import { UpdateBoardDto } from '../dtos/update-board.dto';
import { UserService } from '../../users/services/user.service';

describe('BoardsService', () => {
  let boardsService: BoardsService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
  };

  const mockBoardRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockBoardMemberRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockUserService = {
    getUserByUsername: jest.fn(),
  };

  const mockBoard: Board = {
    id: 'board-uuid-123',
    title: 'Test Board',
    description: 'Test Description',
    thumbnail: null,
    ownerId: 'user-uuid-123',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    owner: null as any,
    lists: [],
    members: [],
  };

  const userId = 'user-uuid-123';
  const otherUserId = 'other-user-uuid';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardsService,
        {
          provide: getRepositoryToken(Board),
          useValue: mockBoardRepository,
        },
        {
          provide: getRepositoryToken(BoardMember),
          useValue: mockBoardMemberRepository,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    boardsService = module.get<BoardsService>(BoardsService);

    jest.clearAllMocks();
  });

  describe('createBoard', () => {
    it('should successfully create a board', async () => {
      const createBoardDto: CreateBoardDto = {
        title: 'New Board',
        description: 'New Description',
      };

      const createdBoard = {
        ...mockBoard,
        ...createBoardDto,
        ownerId: userId,
      };

      mockBoardRepository.create.mockReturnValue(createdBoard);
      mockBoardRepository.save.mockResolvedValue(createdBoard);

      const result = await boardsService.createBoard(createBoardDto, userId);

      expect(result).toEqual({
        id: createdBoard.id,
        title: createdBoard.title,
        description: createdBoard.description,
        thumbnail: createdBoard.thumbnail,
        ownerId: createdBoard.ownerId,
        createdAt: createdBoard.createdAt,
        updatedAt: createdBoard.updatedAt,
      });

      expect(mockBoardRepository.create).toHaveBeenCalledWith({
        ...createBoardDto,
        ownerId: userId,
      });

      expect(mockBoardRepository.save).toHaveBeenCalledWith(createdBoard);
    });

    it('should create board with thumbnail if provided', async () => {
      const createBoardDto: CreateBoardDto = {
        title: 'New Board',
        description: 'New Description',
        thumbnail: 'https://example.com/thumb.jpg',
      };

      const createdBoard = {
        ...mockBoard,
        ...createBoardDto,
        ownerId: userId,
      };

      mockBoardRepository.create.mockReturnValue(createdBoard);
      mockBoardRepository.save.mockResolvedValue(createdBoard);

      const result = await boardsService.createBoard(createBoardDto, userId);

      expect(result.thumbnail).toBe(createBoardDto.thumbnail);
      expect(mockBoardRepository.create).toHaveBeenCalledWith({
        ...createBoardDto,
        ownerId: userId,
      });
    });
  });

  describe('getAllUserBoards', () => {
    it('should return all boards for a user (owned)', async () => {
      const userBoards = [
        mockBoard,
        { ...mockBoard, id: 'board-uuid-456', title: 'Second Board' },
      ];

      mockQueryBuilder.getMany
        .mockResolvedValueOnce(userBoards)
        .mockResolvedValueOnce([]);

      const result = await boardsService.getAllUserBoards(userId);

      expect(result).toHaveLength(2);
      expect(result[0].ownerId).toBe(userId);
      expect(result[0].userRole).toBe('owner');
      expect(result[0].memberCount).toBe(1);
      expect(result[1].ownerId).toBe(userId);
      expect(result[1].userRole).toBe('owner');
    });

    it('should return empty array if user has no boards', async () => {
      mockQueryBuilder.getMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await boardsService.getAllUserBoards(userId);

      expect(result).toEqual([]);
    });

    it('should return owned boards and member boards', async () => {
      const ownedBoard = { ...mockBoard, ownerId: userId, members: [] };
      const memberBoard = {
        ...mockBoard,
        id: 'board-uuid-999',
        ownerId: 'other-owner',
        title: 'Shared Board',
        members: [],
      };

      mockQueryBuilder.getMany
        .mockResolvedValueOnce([ownedBoard])
        .mockResolvedValueOnce([memberBoard]);

      mockBoardMemberRepository.findOne.mockResolvedValue({
        id: 'member-1',
        boardId: memberBoard.id,
        userId,
        role: 'moderator',
      });

      const result = await boardsService.getAllUserBoards(userId);

      expect(result).toHaveLength(2);
      expect(result[0].userRole).toBe('owner');
      expect(result[0].id).toBe(ownedBoard.id);
      expect(result[1].userRole).toBe('moderator');
      expect(result[1].id).toBe(memberBoard.id);
    });
  });

  describe('getBoardById', () => {
    it('should return board with role if user owns it', async () => {
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);

      const result = await boardsService.getBoardById(mockBoard.id, userId);

      expect(result).toEqual({
        id: mockBoard.id,
        title: mockBoard.title,
        description: mockBoard.description,
        thumbnail: mockBoard.thumbnail,
        ownerId: mockBoard.ownerId,
        userRole: 'owner',
        memberCount: 1,
        createdAt: mockBoard.createdAt,
        updatedAt: mockBoard.updatedAt,
      });

      expect(mockBoardRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockBoard.id },
        relations: ['members'],
      });
    });

    it('should return board with role if user is a member', async () => {
      const boardWithDifferentOwner = {
        ...mockBoard,
        ownerId: 'different-owner',
      };

      mockBoardRepository.findOne.mockResolvedValue(boardWithDifferentOwner);
      mockBoardMemberRepository.findOne.mockResolvedValue({
        id: 'member-1',
        boardId: mockBoard.id,
        userId,
        role: 'moderator',
      });

      const result = await boardsService.getBoardById(mockBoard.id, userId);

      expect(result.userRole).toBe('moderator');
      expect(result.memberCount).toBe(1);
    });

    it('should throw NotFoundException if board does not exist', async () => {
      mockBoardRepository.findOne.mockResolvedValue(null);

      await expect(
        boardsService.getBoardById('non-existent-id', userId),
      ).rejects.toThrow(NotFoundException);

      await expect(
        boardsService.getBoardById('non-existent-id', userId),
      ).rejects.toThrow('Board with ID non-existent-id not found');
    });

    it('should throw ForbiddenException if user is not owner or member', async () => {
      const boardWithDifferentOwner = {
        ...mockBoard,
        ownerId: 'different-owner',
      };

      mockBoardRepository.findOne.mockResolvedValue(boardWithDifferentOwner);
      mockBoardMemberRepository.findOne.mockResolvedValue(null);

      await expect(
        boardsService.getBoardById(mockBoard.id, otherUserId),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        boardsService.getBoardById(mockBoard.id, otherUserId),
      ).rejects.toThrow('You do not have access to this board');
    });
  });

  describe('updateBoard', () => {
    it('should successfully update board if user owns it', async () => {
      const updateBoardDto: UpdateBoardDto = {
        title: 'Updated Title',
        description: 'Updated Description',
      };

      const updatedBoard = {
        ...mockBoard,
        ...updateBoardDto,
      };

      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockBoardRepository.save.mockResolvedValue(updatedBoard);

      const result = await boardsService.updateBoard(
        mockBoard.id,
        updateBoardDto,
        userId,
      );

      expect(result.title).toBe(updateBoardDto.title);
      expect(result.description).toBe(updateBoardDto.description);

      expect(mockBoardRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockBoard.id,
          title: updateBoardDto.title,
          description: updateBoardDto.description,
        }),
      );
    });

    it('should throw NotFoundException if board does not exist', async () => {
      const updateBoardDto: UpdateBoardDto = {
        title: 'Updated Title',
      };

      mockBoardRepository.findOne.mockResolvedValue(null);

      await expect(
        boardsService.updateBoard('non-existent-id', updateBoardDto, userId),
      ).rejects.toThrow(NotFoundException);

      await expect(
        boardsService.updateBoard('non-existent-id', updateBoardDto, userId),
      ).rejects.toThrow('Board with ID non-existent-id not found');

      expect(mockBoardRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user does not own board', async () => {
      const updateBoardDto: UpdateBoardDto = {
        title: 'Updated Title',
      };

      mockBoardRepository.findOne.mockResolvedValue(mockBoard);

      await expect(
        boardsService.updateBoard(mockBoard.id, updateBoardDto, otherUserId),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        boardsService.updateBoard(mockBoard.id, updateBoardDto, otherUserId),
      ).rejects.toThrow('You do not have permission to update this board');

      expect(mockBoardRepository.save).not.toHaveBeenCalled();
    });

    it('should only update provided fields', async () => {
      const updateBoardDto: UpdateBoardDto = {
        title: 'Updated Title Only',
      };

      const updatedBoard = {
        ...mockBoard,
        title: updateBoardDto.title,
      };

      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockBoardRepository.save.mockResolvedValue(updatedBoard);

      const result = await boardsService.updateBoard(
        mockBoard.id,
        updateBoardDto,
        userId,
      );

      expect(result.title).toBe(updateBoardDto.title);
      expect(result.description).toBe(mockBoard.description);
    });
  });

  describe('deleteBoard', () => {
    it('should successfully delete board if user owns it', async () => {
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockBoardRepository.remove.mockResolvedValue(mockBoard);

      await boardsService.deleteBoard(mockBoard.id, userId);

      expect(mockBoardRepository.remove).toHaveBeenCalledWith(mockBoard);
    });

    it('should throw NotFoundException if board does not exist', async () => {
      mockBoardRepository.findOne.mockResolvedValue(null);

      await expect(
        boardsService.deleteBoard('non-existent-id', userId),
      ).rejects.toThrow(NotFoundException);

      await expect(
        boardsService.deleteBoard('non-existent-id', userId),
      ).rejects.toThrow('Board with ID non-existent-id not found');

      expect(mockBoardRepository.remove).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user does not own board', async () => {
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);

      await expect(
        boardsService.deleteBoard(mockBoard.id, otherUserId),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        boardsService.deleteBoard(mockBoard.id, otherUserId),
      ).rejects.toThrow('You do not have permission to delete this board');

      expect(mockBoardRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('inviteMember', () => {
    const invitedUser = {
      id: 'invited-user-uuid',
      username: 'inviteduser',
      email: 'invited@example.com',
      avatarUrl: null,
    };

    it('should successfully invite a member to board', async () => {
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockUserService.getUserByUsername.mockResolvedValue(invitedUser);
      mockBoardMemberRepository.findOne.mockResolvedValue(null);
      mockBoardMemberRepository.create.mockReturnValue({
        boardId: mockBoard.id,
        userId: invitedUser.id,
        role: 'moderator',
      });
      mockBoardMemberRepository.save.mockResolvedValue({
        id: 'member-uuid',
        boardId: mockBoard.id,
        userId: invitedUser.id,
        role: 'moderator',
        createdAt: new Date(),
      });

      const result = await boardsService.inviteMember(
        mockBoard.id,
        'inviteduser',
        'moderator',
        userId,
      );

      expect(result.userId).toBe(invitedUser.id);
      expect(result.role).toBe('moderator');
      expect(mockBoardMemberRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if board does not exist', async () => {
      mockBoardRepository.findOne.mockResolvedValue(null);

      await expect(
        boardsService.inviteMember(
          'non-existent-id',
          'inviteduser',
          'moderator',
          userId,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if inviter is not owner', async () => {
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);

      await expect(
        boardsService.inviteMember(
          mockBoard.id,
          'inviteduser',
          'moderator',
          otherUserId,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockUserService.getUserByUsername.mockResolvedValue(null);

      await expect(
        boardsService.inviteMember(
          mockBoard.id,
          'nonexistent',
          'moderator',
          userId,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if user already a member', async () => {
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockUserService.getUserByUsername.mockResolvedValue(invitedUser);
      mockBoardMemberRepository.findOne.mockResolvedValue({
        id: 'existing-member',
        boardId: mockBoard.id,
        userId: invitedUser.id,
      });

      await expect(
        boardsService.inviteMember(
          mockBoard.id,
          'inviteduser',
          'moderator',
          userId,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getBoardMembers', () => {
    it('should return all board members', async () => {
      const mockMembers = [
        {
          id: 'member-1',
          boardId: mockBoard.id,
          userId: 'user-1',
          role: 'moderator',
          createdAt: new Date(),
          user: {
            id: 'user-1',
            username: 'user1',
            email: 'user1@example.com',
            avatarUrl: null,
          },
        },
      ];

      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockBoardMemberRepository.findOne.mockResolvedValue(null);
      mockBoardMemberRepository.find.mockResolvedValue(mockMembers);

      const result = await boardsService.getBoardMembers(mockBoard.id, userId);

      expect(result).toHaveLength(1);
      expect(result[0].user.username).toBe('user1');
    });

    it('should throw NotFoundException if board does not exist', async () => {
      mockBoardRepository.findOne.mockResolvedValue(null);

      await expect(
        boardsService.getBoardMembers('non-existent-id', userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user has no access', async () => {
      mockBoardRepository.findOne.mockResolvedValue({
        ...mockBoard,
        ownerId: otherUserId,
      });
      mockBoardMemberRepository.findOne.mockResolvedValue(null);

      await expect(
        boardsService.getBoardMembers(mockBoard.id, userId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateMemberRole', () => {
    const mockMember = {
      id: 'member-uuid',
      boardId: mockBoard.id,
      userId: 'member-user-uuid',
      role: 'visitor',
      user: {
        id: 'member-user-uuid',
        username: 'memberuser',
        email: 'member@example.com',
        avatarUrl: null,
      },
    };

    it('should successfully update member role', async () => {
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockBoardMemberRepository.findOne.mockResolvedValue(mockMember);
      mockBoardMemberRepository.save.mockResolvedValue({
        ...mockMember,
        role: 'moderator',
      });

      const result = await boardsService.updateMemberRole(
        mockBoard.id,
        'member-uuid',
        'moderator',
        userId,
      );

      expect(result.role).toBe('moderator');
    });

    it('should throw ForbiddenException if requester is not owner', async () => {
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);

      await expect(
        boardsService.updateMemberRole(
          mockBoard.id,
          'member-uuid',
          'moderator',
          otherUserId,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeMember', () => {
    const mockMember = {
      id: 'member-uuid',
      boardId: mockBoard.id,
      userId: 'member-user-uuid',
    };

    it('should successfully remove member', async () => {
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockBoardMemberRepository.findOne.mockResolvedValue(mockMember);
      mockBoardMemberRepository.remove.mockResolvedValue(mockMember);

      await boardsService.removeMember(mockBoard.id, 'member-uuid', userId);

      expect(mockBoardMemberRepository.remove).toHaveBeenCalledWith(mockMember);
    });

    it('should throw ForbiddenException if requester is not owner', async () => {
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);

      await expect(
        boardsService.removeMember(mockBoard.id, 'member-uuid', otherUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if member not found', async () => {
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockBoardMemberRepository.findOne.mockResolvedValue(null);

      await expect(
        boardsService.removeMember(mockBoard.id, 'member-uuid', userId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
