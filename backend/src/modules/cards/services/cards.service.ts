import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from '../entities/card.entity';
import { List } from '../../lists/entities/list.entity';
import { CreateCardDto } from '../dtos/create-card.dto';
import { UpdateCardDto } from '../dtos/update-card.dto';
import { CardResponseDto } from '../dtos/card-response.dto';

@Injectable()
export class CardsService {
  constructor(
    @InjectRepository(Card)
    private cardRepository: Repository<Card>,
    @InjectRepository(List)
    private listRepository: Repository<List>,
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
  ): Promise<CardResponseDto[]> {
    await this.verifyListOwnership(listId, userId);

    const cards = await this.cardRepository.find({
      where: { listId },
      order: { position: 'ASC' },
    });

    return cards.map((card) => this.mapToCardResponseDto(card));
  }

  async getCardById(cardId: string, userId: string): Promise<CardResponseDto> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['list', 'list.board'],
    });

    if (!card) {
      throw new NotFoundException(`Card with ID ${cardId} not found`);
    }

    if (card.list.board.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this card');
    }

    return this.mapToCardResponseDto(card);
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
}
