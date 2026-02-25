import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CommentsService } from './comments.service';
import { Comment } from '../entities/comment.entity';
import { Card } from '../entities/card.entity';
import { BoardPermissionService } from '../../boards/services/board-permission.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateCommentDto } from '../dtos/create-comment.dto';
import { UpdateCommentDto } from '../dtos/update-comment.dto';

describe('CommentsService', () => {
  let service: CommentsService;

  const mockCommentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockCardRepository = {
    findOne: jest.fn(),
  };

  const mockBoardPermissionService = {
    canEditBoard: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: getRepositoryToken(Comment),
          useValue: mockCommentRepository,
        },
        {
          provide: getRepositoryToken(Card),
          useValue: mockCardRepository,
        },
        {
          provide: BoardPermissionService,
          useValue: mockBoardPermissionService,
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createComment', () => {
    it('should create a comment successfully', async () => {
      const cardId = 'card-1';
      const authorId = 'user-1';
      const createCommentDto: CreateCommentDto = {
        content: 'This is a test comment',
      };

      const mockCard = {
        id: cardId,
        title: 'Test Card',
        listId: 'list-1',
        list: {
          id: 'list-1',
          boardId: 'board-1',
        },
      };

      const mockAuthor = {
        id: authorId,
        username: 'testuser',
        email: 'test@example.com',
        avatarUrl: null,
      };

      const createdAt = new Date('2024-01-01T10:00:00Z');
      const mockComment = {
        id: 'comment-1',
        content: createCommentDto.content,
        cardId,
        authorId,
        createdAt,
        updatedAt: createdAt,
        author: mockAuthor,
      };

      mockCardRepository.findOne.mockResolvedValue(mockCard);
      mockCommentRepository.create.mockReturnValue({
        content: createCommentDto.content,
        cardId,
        authorId,
      });
      mockCommentRepository.save.mockResolvedValue({
        id: 'comment-1',
        content: createCommentDto.content,
        cardId,
        authorId,
      });
      mockCommentRepository.findOne.mockResolvedValue(mockComment);

      const result = await service.createComment(
        cardId,
        authorId,
        createCommentDto,
      );

      expect(result).toEqual({
        id: 'comment-1',
        content: 'This is a test comment',
        cardId,
        authorId,
        author: {
          id: authorId,
          username: 'testuser',
          email: 'test@example.com',
          avatarUrl: null,
        },
        createdAt,
        updatedAt: createdAt,
        isEdited: false,
      });
      expect(mockCardRepository.findOne).toHaveBeenCalledWith({
        where: { id: cardId },
        relations: ['list'],
      });
      expect(mockCommentRepository.create).toHaveBeenCalledWith({
        content: createCommentDto.content,
        cardId,
        authorId,
      });
      expect(mockCommentRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if card not found', async () => {
      const cardId = 'non-existent-card';
      const authorId = 'user-1';
      const createCommentDto: CreateCommentDto = {
        content: 'This is a test comment',
      };

      mockCardRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createComment(cardId, authorId, createCommentDto),
      ).rejects.toThrow(NotFoundException);
      expect(mockCommentRepository.create).not.toHaveBeenCalled();
      expect(mockCommentRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getCommentsByCard', () => {
    it('should return comments ordered by createdAt DESC', async () => {
      const cardId = 'card-1';
      const userId = 'user-1';

      const mockCard = {
        id: cardId,
        title: 'Test Card',
      };

      const mockAuthor = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        avatarUrl: null,
      };

      const date1 = new Date('2024-01-01T10:00:00Z');
      const date2 = new Date('2024-01-01T11:00:00Z');
      const date3 = new Date('2024-01-01T12:00:00Z');

      const mockComments = [
        {
          id: 'comment-3',
          content: 'Latest comment',
          cardId,
          authorId: 'user-1',
          createdAt: date3,
          updatedAt: date3,
          author: mockAuthor,
        },
        {
          id: 'comment-2',
          content: 'Middle comment',
          cardId,
          authorId: 'user-1',
          createdAt: date2,
          updatedAt: date2,
          author: mockAuthor,
        },
        {
          id: 'comment-1',
          content: 'Oldest comment',
          cardId,
          authorId: 'user-1',
          createdAt: date1,
          updatedAt: date1,
          author: mockAuthor,
        },
      ];

      mockCardRepository.findOne.mockResolvedValue(mockCard);
      mockCommentRepository.find.mockResolvedValue(mockComments);

      const result = await service.getCommentsByCard(cardId, userId);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('comment-3');
      expect(result[1].id).toBe('comment-2');
      expect(result[2].id).toBe('comment-1');
      expect(mockCommentRepository.find).toHaveBeenCalledWith({
        where: { cardId },
        relations: ['author'],
        order: { createdAt: 'DESC' },
      });
    });

    it('should calculate isEdited flag correctly', async () => {
      const cardId = 'card-1';
      const userId = 'user-1';

      const mockCard = {
        id: cardId,
        title: 'Test Card',
      };

      const mockAuthor = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        avatarUrl: null,
      };

      const createdAt = new Date('2024-01-01T10:00:00Z');
      const updatedAt = new Date('2024-01-01T10:05:00Z');

      const mockComments = [
        {
          id: 'comment-1',
          content: 'Edited comment',
          cardId,
          authorId: 'user-1',
          createdAt,
          updatedAt,
          author: mockAuthor,
        },
      ];

      mockCardRepository.findOne.mockResolvedValue(mockCard);
      mockCommentRepository.find.mockResolvedValue(mockComments);

      const result = await service.getCommentsByCard(cardId, userId);

      expect(result[0].isEdited).toBe(true);
    });

    it('should throw NotFoundException if card not found', async () => {
      const cardId = 'non-existent-card';
      const userId = 'user-1';

      mockCardRepository.findOne.mockResolvedValue(null);

      await expect(service.getCommentsByCard(cardId, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockCommentRepository.find).not.toHaveBeenCalled();
    });

    it('should return empty array if no comments exist', async () => {
      const cardId = 'card-1';
      const userId = 'user-1';

      const mockCard = {
        id: cardId,
        title: 'Test Card',
      };

      mockCardRepository.findOne.mockResolvedValue(mockCard);
      mockCommentRepository.find.mockResolvedValue([]);

      const result = await service.getCommentsByCard(cardId, userId);

      expect(result).toEqual([]);
    });
  });

  describe('updateComment', () => {
    it('should update comment if user is the author', async () => {
      const commentId = 'comment-1';
      const authorId = 'user-1';
      const updateCommentDto: UpdateCommentDto = {
        content: 'Updated comment content',
      };

      const mockAuthor = {
        id: authorId,
        username: 'testuser',
        email: 'test@example.com',
        avatarUrl: null,
      };

      const createdAt = new Date('2024-01-01T10:00:00Z');
      const updatedAt = new Date('2024-01-01T10:05:00Z');

      const mockComment = {
        id: commentId,
        content: 'Original content',
        cardId: 'card-1',
        authorId,
        createdAt,
        updatedAt: createdAt,
        author: mockAuthor,
      };

      const updatedComment = {
        ...mockComment,
        content: updateCommentDto.content,
        updatedAt,
      };

      mockCommentRepository.findOne.mockResolvedValue(mockComment);
      mockCommentRepository.save.mockResolvedValue(updatedComment);

      const result = await service.updateComment(
        commentId,
        authorId,
        updateCommentDto,
      );

      expect(result.content).toBe('Updated comment content');
      expect(result.isEdited).toBe(true);
      expect(mockCommentRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not the author', async () => {
      const commentId = 'comment-1';
      const authorId = 'user-1';
      const differentUserId = 'user-2';
      const updateCommentDto: UpdateCommentDto = {
        content: 'Updated comment content',
      };

      const mockAuthor = {
        id: authorId,
        username: 'testuser',
        email: 'test@example.com',
        avatarUrl: null,
      };

      const mockComment = {
        id: commentId,
        content: 'Original content',
        cardId: 'card-1',
        authorId,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: mockAuthor,
      };

      mockCommentRepository.findOne.mockResolvedValue(mockComment);

      await expect(
        service.updateComment(commentId, differentUserId, updateCommentDto),
      ).rejects.toThrow(ForbiddenException);
      expect(mockCommentRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if comment not found', async () => {
      const commentId = 'non-existent-comment';
      const authorId = 'user-1';
      const updateCommentDto: UpdateCommentDto = {
        content: 'Updated comment content',
      };

      mockCommentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateComment(commentId, authorId, updateCommentDto),
      ).rejects.toThrow(NotFoundException);
      expect(mockCommentRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('deleteComment', () => {
    it('should delete comment if user is the author', async () => {
      const commentId = 'comment-1';
      const userId = 'user-1';
      const cardId = 'card-1';

      const mockComment = {
        id: commentId,
        content: 'Test comment',
        cardId,
        authorId: userId,
        card: {
          id: cardId,
          list: {
            id: 'list-1',
            boardId: 'board-1',
          },
        },
      };

      mockCommentRepository.findOne.mockResolvedValue(mockComment);
      mockCommentRepository.remove.mockResolvedValue(mockComment);

      await service.deleteComment(commentId, userId, cardId);

      expect(mockCommentRepository.remove).toHaveBeenCalledWith(mockComment);
    });

    it('should delete comment if user is moderator/owner', async () => {
      const commentId = 'comment-1';
      const authorId = 'user-1';
      const moderatorId = 'user-2';
      const cardId = 'card-1';
      const boardId = 'board-1';

      const mockComment = {
        id: commentId,
        content: 'Test comment',
        cardId,
        authorId,
        card: {
          id: cardId,
          list: {
            id: 'list-1',
            boardId,
          },
        },
      };

      mockCommentRepository.findOne.mockResolvedValue(mockComment);
      mockBoardPermissionService.canEditBoard.mockResolvedValue(true);
      mockCommentRepository.remove.mockResolvedValue(mockComment);

      await service.deleteComment(commentId, moderatorId, cardId);

      expect(mockBoardPermissionService.canEditBoard).toHaveBeenCalledWith(
        moderatorId,
        boardId,
      );
      expect(mockCommentRepository.remove).toHaveBeenCalledWith(mockComment);
    });

    it('should throw ForbiddenException if user is neither author nor moderator/owner', async () => {
      const commentId = 'comment-1';
      const authorId = 'user-1';
      const visitorId = 'user-3';
      const cardId = 'card-1';
      const boardId = 'board-1';

      const mockComment = {
        id: commentId,
        content: 'Test comment',
        cardId,
        authorId,
        card: {
          id: cardId,
          list: {
            id: 'list-1',
            boardId,
          },
        },
      };

      mockCommentRepository.findOne.mockResolvedValue(mockComment);
      mockBoardPermissionService.canEditBoard.mockResolvedValue(false);

      await expect(
        service.deleteComment(commentId, visitorId, cardId),
      ).rejects.toThrow(ForbiddenException);
      expect(mockCommentRepository.remove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if comment not found', async () => {
      const commentId = 'non-existent-comment';
      const userId = 'user-1';
      const cardId = 'card-1';

      mockCommentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deleteComment(commentId, userId, cardId),
      ).rejects.toThrow(NotFoundException);
      expect(mockCommentRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('getCommentById', () => {
    it('should return comment if found', async () => {
      const commentId = 'comment-1';

      const mockAuthor = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        avatarUrl: null,
      };

      const mockComment = {
        id: commentId,
        content: 'Test comment',
        cardId: 'card-1',
        authorId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: mockAuthor,
      };

      mockCommentRepository.findOne.mockResolvedValue(mockComment);

      const result = await service.getCommentById(commentId);

      expect(result).toEqual(mockComment);
      expect(mockCommentRepository.findOne).toHaveBeenCalledWith({
        where: { id: commentId },
        relations: ['author'],
      });
    });

    it('should return null if comment not found', async () => {
      const commentId = 'non-existent-comment';

      mockCommentRepository.findOne.mockResolvedValue(null);

      const result = await service.getCommentById(commentId);

      expect(result).toBeNull();
    });
  });
});
