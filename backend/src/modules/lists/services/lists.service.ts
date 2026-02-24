import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { List } from '../entities/list.entity';
import { Board } from '../../boards/entities/board.entity';
import { CreateListDto } from '../dtos/create-list.dto';
import { UpdateListDto } from '../dtos/update-list.dto';
import { ListResponseDto } from '../dtos/list-response.dto';
import { ListWithCardsResponseDto } from '../dtos/list-with-cards-response.dto';

@Injectable()
export class ListsService {
  constructor(
    @InjectRepository(List)
    private listRepository: Repository<List>,
    @InjectRepository(Board)
    private boardRepository: Repository<Board>,
  ) {}

  async createList(
    boardId: string,
    createListDto: CreateListDto,
    userId: string,
  ): Promise<ListResponseDto> {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException(`Board with ID ${boardId} not found`);
    }

    let position = createListDto.position;
    if (position === undefined) {
      const maxPosition = await this.listRepository
        .createQueryBuilder('list')
        .where('list.boardId = :boardId', { boardId })
        .select('MAX(list.position)', 'max')
        .getRawOne();
      position = (maxPosition.max ?? -1) + 1;
    }

    const list = this.listRepository.create({
      ...createListDto,
      boardId,
      position,
    });

    const savedList = await this.listRepository.save(list);
    return this.mapToListResponseDto(savedList);
  }

  async getAllListsInBoard(
    boardId: string,
    userId: string,
  ): Promise<ListResponseDto[]> {
    // Permission check is handled by ResourcePermissionGuard
    // Just verify board exists
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException(`Board with ID ${boardId} not found`);
    }

    const lists = await this.listRepository.find({
      where: { boardId },
      order: { position: 'ASC' },
    });

    return lists.map((list) => this.mapToListResponseDto(list));
  }

  async getListById(
    listId: string,
    userId: string,
  ): Promise<ListWithCardsResponseDto> {
    const list = await this.listRepository.findOne({
      where: { id: listId },
      relations: ['board', 'cards', 'cards.assignedUsers'],
      order: { cards: { position: 'ASC' } },
    });

    if (!list) {
      throw new NotFoundException(`List with ID ${listId} not found`);
    }

    // Permission check is handled by ResourcePermissionGuard

    return this.mapToListWithCardsResponseDto(list);
  }

  async updateList(
    listId: string,
    updateListDto: UpdateListDto,
    userId: string,
  ): Promise<ListResponseDto> {
    const list = await this.listRepository.findOne({
      where: { id: listId },
      relations: ['board'],
    });

    if (!list) {
      throw new NotFoundException(`List with ID ${listId} not found`);
    }

    // Permission check is handled by ResourcePermissionGuard

    Object.assign(list, updateListDto);

    const updatedList = await this.listRepository.save(list);
    return this.mapToListResponseDto(updatedList);
  }

  async deleteList(listId: string, userId: string): Promise<void> {
    const list = await this.listRepository.findOne({
      where: { id: listId },
      relations: ['board'],
    });

    if (!list) {
      throw new NotFoundException(`List with ID ${listId} not found`);
    }

    // Permission check is handled by ResourcePermissionGuard

    await this.listRepository.remove(list);
  }

  private mapToListResponseDto(list: List): ListResponseDto {
    return {
      id: list.id,
      title: list.title,
      position: list.position,
      boardId: list.boardId,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
    };
  }

  private mapToListWithCardsResponseDto(list: List): ListWithCardsResponseDto {
    return {
      id: list.id,
      title: list.title,
      position: list.position,
      boardId: list.boardId,
      cards: (list.cards || []).map((card) => ({
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
      })),
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
    };
  }
}
