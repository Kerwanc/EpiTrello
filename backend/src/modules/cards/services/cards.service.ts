import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from '../entities/card.entity';
import { List } from '../../lists/entities/list.entity';
import { User } from '../../users/entities/user.entity';
import { BoardMember } from '../../boards/entities/board-member.entity';
import { CreateCardDto } from '../dtos/create-card.dto';
import { UpdateCardDto } from '../dtos/update-card.dto';
import { CardResponseDto } from '../dtos/card-response.dto';
import {
  CardAssignmentResponseDto,
  UserSummaryDto,
} from '../dtos/card-assignment-response.dto';

@Injectable()
export class CardsService {
  constructor(
    @InjectRepository(Card)
    private cardRepository: Repository<Card>,
    @InjectRepository(List)
    private listRepository: Repository<List>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(BoardMember)
    private boardMemberRepository: Repository<BoardMember>,
  ) {}

  async createCard(
    listId: string,
    createCardDto: CreateCardDto,
    userId: string,
  ): Promise<CardResponseDto> {
    await this.verifyListOwnership(listId, userId);

    let position = createCardDto.position;
    if (position === undefined) {
      const maxPosition = await this.cardRepository
        .createQueryBuilder('card')
        .where('card.listId = :listId', { listId })
        .select('MAX(card.position)', 'max')
        .getRawOne();
      position = (maxPosition.max ?? -1) + 1;
    }

    const dueDate = createCardDto.dueDate
      ? new Date(createCardDto.dueDate)
      : null;

    const card = this.cardRepository.create({
      ...createCardDto,
      listId,
      position,
      dueDate,
    });

    const savedCard = await this.cardRepository.save(card);
    return this.mapToCardResponseDto(savedCard);
  }

  async getAllCardsInList(
    listId: string,
    userId: string,
  ): Promise<CardAssignmentResponseDto[]> {
    await this.verifyListOwnership(listId, userId);

    const cards = await this.cardRepository.find({
      where: { listId },
      relations: ['assignedUsers'],
      order: { position: 'ASC' },
    });

    return cards.map((card) => this.mapToCardAssignmentResponseDto(card));
  }

  async getCardById(
    cardId: string,
    userId: string,
  ): Promise<CardAssignmentResponseDto> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['list', 'list.board', 'assignedUsers'],
    });

    if (!card) {
      throw new NotFoundException(`Card with ID ${cardId} not found`);
    }

    if (card.list.board.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this card');
    }

    return this.mapToCardAssignmentResponseDto(card);
  }

  async updateCard(
    cardId: string,
    updateCardDto: UpdateCardDto,
    userId: string,
  ): Promise<CardResponseDto> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['list', 'list.board'],
    });

    if (!card) {
      throw new NotFoundException(`Card with ID ${cardId} not found`);
    }

    if (card.list.board.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this card',
      );
    }

    if (
      updateCardDto.listId !== undefined &&
      updateCardDto.listId !== card.listId
    ) {
      await this.verifyListOwnership(updateCardDto.listId, userId);
      card.listId = updateCardDto.listId;
      (card as any).list = undefined;
    }

    if (updateCardDto.dueDate !== undefined) {
      card.dueDate = updateCardDto.dueDate
        ? new Date(updateCardDto.dueDate)
        : null;
    }

    if (updateCardDto.title !== undefined) card.title = updateCardDto.title;
    if (updateCardDto.description !== undefined)
      card.description = updateCardDto.description;
    if (updateCardDto.tags !== undefined) card.tags = updateCardDto.tags;
    if (updateCardDto.position !== undefined)
      card.position = updateCardDto.position;

    const updatedCard = await this.cardRepository.save(card);
    return this.mapToCardResponseDto(updatedCard);
  }

  async deleteCard(cardId: string, userId: string): Promise<void> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['list', 'list.board'],
    });

    if (!card) {
      throw new NotFoundException(`Card with ID ${cardId} not found`);
    }

    if (card.list.board.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this card',
      );
    }

    await this.cardRepository.remove(card);
  }

  private async verifyListOwnership(
    listId: string,
    userId: string,
  ): Promise<void> {
    const list = await this.listRepository.findOne({
      where: { id: listId },
      relations: ['board'],
    });

    if (!list) {
      throw new NotFoundException(`List with ID ${listId} not found`);
    }

    if (list.board.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this list');
    }
  }

  private mapToCardResponseDto(card: Card): CardResponseDto {
    return {
      id: card.id,
      title: card.title,
      description: card.description,
      dueDate: card.dueDate,
      tags: card.tags,
      position: card.position,
      listId: card.listId,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
    };
  }

  async assignUser(
    cardId: string,
    userIdToAssign: string,
    _assignerId: string,
  ): Promise<CardAssignmentResponseDto> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['list', 'list.board', 'assignedUsers'],
    });

    if (!card) {
      throw new NotFoundException(`Card with ID ${cardId} not found`);
    }

    const boardId = card.list.board.id;
    const board = card.list.board;

    const userToAssign = await this.userRepository.findOne({
      where: { id: userIdToAssign },
    });

    if (!userToAssign) {
      throw new NotFoundException(`User with ID ${userIdToAssign} not found`);
    }

    const isOwner = board.ownerId === userIdToAssign;
    const isMember = await this.boardMemberRepository.findOne({
      where: { boardId, userId: userIdToAssign },
    });

    if (!isOwner && !isMember) {
      throw new BadRequestException(
        'User must be a board member to be assigned to a card',
      );
    }

    const alreadyAssigned = card.assignedUsers?.some(
      (user) => user.id === userIdToAssign,
    );

    if (alreadyAssigned) {
      throw new BadRequestException('User is already assigned to this card');
    }

    card.assignedUsers = card.assignedUsers || [];
    card.assignedUsers.push(userToAssign);

    await this.cardRepository.save(card);

    return this.mapToCardAssignmentResponseDto(card);
  }

  async unassignUser(
    cardId: string,
    userIdToUnassign: string,
    _requesterId: string,
  ): Promise<CardAssignmentResponseDto> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['assignedUsers'],
    });

    if (!card) {
      throw new NotFoundException(`Card with ID ${cardId} not found`);
    }

    const isAssigned = card.assignedUsers?.some(
      (user) => user.id === userIdToUnassign,
    );

    if (!isAssigned) {
      throw new BadRequestException('User is not assigned to this card');
    }

    card.assignedUsers = card.assignedUsers.filter(
      (user) => user.id !== userIdToUnassign,
    );

    await this.cardRepository.save(card);

    return this.mapToCardAssignmentResponseDto(card);
  }

  async getCardAssignments(
    cardId: string,
    userId: string,
  ): Promise<UserSummaryDto[]> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['list', 'list.board', 'assignedUsers'],
    });

    if (!card) {
      throw new NotFoundException(`Card with ID ${cardId} not found`);
    }

    if (card.list.board.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this card');
    }

    return (card.assignedUsers || []).map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
    }));
  }

  private mapToCardAssignmentResponseDto(
    card: Card,
  ): CardAssignmentResponseDto {
    return {
      id: card.id,
      title: card.title,
      description: card.description,
      dueDate: card.dueDate,
      tags: card.tags,
      position: card.position,
      listId: card.listId,
      assignedUsers: (card.assignedUsers || []).map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
      })),
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
    };
  }
}
