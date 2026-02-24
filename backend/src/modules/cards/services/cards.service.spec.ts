import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CardsService } from './cards.service';
import { Card } from '../entities/card.entity';
import { List } from '../../lists/entities/list.entity';
import { User } from '../../users/entities/user.entity';
import { BoardMember } from '../../boards/entities/board-member.entity';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

describe('CardsService - Assignment Methods', () => {
  let service: CardsService;

  const mockCardRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockListRepository = {
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockBoardMemberRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardsService,
        {
          provide: getRepositoryToken(Card),
          useValue: mockCardRepository,
        },
        {
          provide: getRepositoryToken(List),
          useValue: mockListRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(BoardMember),
          useValue: mockBoardMemberRepository,
        },
      ],
    }).compile();

    service = module.get<CardsService>(CardsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('assignUser', () => {
    it('should assign a user to a card when user is board owner', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
      };
      const mockCard = {
        id: 'card-1',
        title: 'Test Card',
        description: null,
        dueDate: null,
        tags: null,
        position: 0,
        listId: 'list-1',
        assignedUsers: [],
        list: {
          board: {
            id: 'board-1',
            ownerId: 'user-1',
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCardRepository.findOne.mockResolvedValue(mockCard);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockCardRepository.save.mockResolvedValue({
        ...mockCard,
        assignedUsers: [mockUser],
      });

      const result = await service.assignUser('card-1', 'user-1', 'assigner-1');

      expect(result.assignedUsers).toHaveLength(1);
      expect(result.assignedUsers[0].id).toBe('user-1');
      expect(mockCardRepository.save).toHaveBeenCalled();
    });

    it('should assign a user to a card when user is board member', async () => {
      const mockUser = {
        id: 'user-2',
        username: 'member',
        email: 'member@example.com',
      };
      const mockCard = {
        id: 'card-1',
        title: 'Test Card',
        description: null,
        dueDate: null,
        tags: null,
        position: 0,
        listId: 'list-1',
        assignedUsers: [],
        list: {
          board: {
            id: 'board-1',
            ownerId: 'user-1',
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockBoardMember = {
        id: 'member-1',
        boardId: 'board-1',
        userId: 'user-2',
      };

      mockCardRepository.findOne.mockResolvedValue(mockCard);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockBoardMemberRepository.findOne.mockResolvedValue(mockBoardMember);
      mockCardRepository.save.mockResolvedValue({
        ...mockCard,
        assignedUsers: [mockUser],
      });

      const result = await service.assignUser('card-1', 'user-2', 'assigner-1');

      expect(result.assignedUsers).toHaveLength(1);
      expect(result.assignedUsers[0].id).toBe('user-2');
    });

    it('should throw NotFoundException if card not found', async () => {
      mockCardRepository.findOne.mockResolvedValue(null);

      await expect(
        service.assignUser('non-existent', 'user-1', 'assigner-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user to assign not found', async () => {
      const mockCard = {
        id: 'card-1',
        list: {
          board: {
            id: 'board-1',
            ownerId: 'owner-1',
          },
        },
        assignedUsers: [],
      };

      mockCardRepository.findOne.mockResolvedValue(mockCard);
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.assignUser('card-1', 'non-existent', 'assigner-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user is not a board member', async () => {
      const mockUser = {
        id: 'user-3',
        username: 'outsider',
        email: 'outsider@example.com',
      };
      const mockCard = {
        id: 'card-1',
        list: {
          board: {
            id: 'board-1',
            ownerId: 'user-1',
          },
        },
        assignedUsers: [],
      };

      mockCardRepository.findOne.mockResolvedValue(mockCard);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockBoardMemberRepository.findOne.mockResolvedValue(null);

      await expect(
        service.assignUser('card-1', 'user-3', 'assigner-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockCardRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if user already assigned', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
      };
      const mockCard = {
        id: 'card-1',
        list: {
          board: {
            id: 'board-1',
            ownerId: 'user-1',
          },
        },
        assignedUsers: [mockUser],
      };

      mockCardRepository.findOne.mockResolvedValue(mockCard);
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.assignUser('card-1', 'user-1', 'assigner-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockCardRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('unassignUser', () => {
    it('should unassign a user from a card', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
      };
      const mockCard = {
        id: 'card-1',
        title: 'Test Card',
        description: null,
        dueDate: null,
        tags: null,
        position: 0,
        listId: 'list-1',
        assignedUsers: [mockUser],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCardRepository.findOne.mockResolvedValue(mockCard);
      mockCardRepository.save.mockResolvedValue({
        ...mockCard,
        assignedUsers: [],
      });

      const result = await service.unassignUser(
        'card-1',
        'user-1',
        'requester-1',
      );

      expect(result.assignedUsers).toHaveLength(0);
      expect(mockCardRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if card not found', async () => {
      mockCardRepository.findOne.mockResolvedValue(null);

      await expect(
        service.unassignUser('non-existent', 'user-1', 'requester-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user is not assigned', async () => {
      const mockCard = {
        id: 'card-1',
        assignedUsers: [],
      };

      mockCardRepository.findOne.mockResolvedValue(mockCard);

      await expect(
        service.unassignUser('card-1', 'user-1', 'requester-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockCardRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getCardAssignments', () => {
    it('should return assigned users for a card', async () => {
      const mockUsers = [
        { id: 'user-1', username: 'user1', email: 'user1@example.com' },
        { id: 'user-2', username: 'user2', email: 'user2@example.com' },
      ];
      const mockCard = {
        id: 'card-1',
        list: {
          board: {
            ownerId: 'owner-1',
          },
        },
        assignedUsers: mockUsers,
      };

      mockCardRepository.findOne.mockResolvedValue(mockCard);

      const result = await service.getCardAssignments('card-1', 'owner-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('user-1');
      expect(result[1].id).toBe('user-2');
    });

    it('should throw NotFoundException if card not found', async () => {
      mockCardRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getCardAssignments('non-existent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return empty array if no users assigned', async () => {
      const mockCard = {
        id: 'card-1',
        list: {
          board: {
            ownerId: 'owner-1',
          },
        },
        assignedUsers: [],
      };

      mockCardRepository.findOne.mockResolvedValue(mockCard);

      const result = await service.getCardAssignments('card-1', 'owner-1');

      expect(result).toHaveLength(0);
    });
  });
});
