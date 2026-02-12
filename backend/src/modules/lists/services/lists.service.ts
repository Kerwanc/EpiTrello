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
    await this.verifyBoardOwnership(boardId, userId);

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
    await this.verifyBoardOwnership(boardId, userId);

    const lists = await this.listRepository.find({
      where: { boardId },
      order: { position: 'ASC' },
    });

    return lists.map((list) => this.mapToListResponseDto(list));
  }

  async getListById(listId: string, userId: string): Promise<ListResponseDto> {
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

    return this.mapToListResponseDto(list);
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

    if (list.board.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this list',
      );
    }

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

    if (list.board.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this list',
      );
    }

    await this.listRepository.remove(list);
  }

  private async verifyBoardOwnership(
    boardId: string,
    userId: string,
  ): Promise<void> {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException(`Board with ID ${boardId} not found`);
    }

    if (board.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this board');
    }
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
}
