import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { Board } from '../entities/board.entity';
import { CreateBoardDto } from '../dtos/create-board.dto';
import { UpdateBoardDto } from '../dtos/update-board.dto';

describe('BoardsService', () => {
  let boardsService: BoardsService;

  const mockBoardRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
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
    it('should return all boards for a user', async () => {
      const userBoards = [
        mockBoard,
        { ...mockBoard, id: 'board-uuid-456', title: 'Second Board' },
      ];

      mockBoardRepository.find.mockResolvedValue(userBoards);

      const result = await boardsService.getAllUserBoards(userId);

      expect(result).toHaveLength(2);
      expect(result[0].ownerId).toBe(userId);
      expect(result[1].ownerId).toBe(userId);

      expect(mockBoardRepository.find).toHaveBeenCalledWith({
        where: { ownerId: userId },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array if user has no boards', async () => {
      mockBoardRepository.find.mockResolvedValue([]);

      const result = await boardsService.getAllUserBoards(userId);

      expect(result).toEqual([]);
      expect(mockBoardRepository.find).toHaveBeenCalledWith({
        where: { ownerId: userId },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getBoardById', () => {
    it('should return board if user owns it', async () => {
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);

      const result = await boardsService.getBoardById(mockBoard.id, userId);

      expect(result).toEqual({
        id: mockBoard.id,
        title: mockBoard.title,
        description: mockBoard.description,
        thumbnail: mockBoard.thumbnail,
        ownerId: mockBoard.ownerId,
        createdAt: mockBoard.createdAt,
        updatedAt: mockBoard.updatedAt,
      });

      expect(mockBoardRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockBoard.id },
      });
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

    it('should throw ForbiddenException if user does not own board', async () => {
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);

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
});
