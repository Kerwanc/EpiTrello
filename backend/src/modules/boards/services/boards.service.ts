import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board } from '../entities/board.entity';
import { CreateBoardDto } from '../dtos/create-board.dto';
import { UpdateBoardDto } from '../dtos/update-board.dto';
import { BoardResponseDto } from '../dtos/board-response.dto';

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private boardRepository: Repository<Board>,
  ) {}

  async createBoard(
    createBoardDto: CreateBoardDto,
    userId: string,
  ): Promise<BoardResponseDto> {
    const board = this.boardRepository.create({
      ...createBoardDto,
      ownerId: userId,
    });

    const savedBoard = await this.boardRepository.save(board);
    return this.mapToBoardResponseDto(savedBoard);
  }

  async getAllUserBoards(userId: string): Promise<BoardResponseDto[]> {
    const boards = await this.boardRepository.find({
      where: { ownerId: userId },
      order: { createdAt: 'DESC' },
    });

    return boards.map((board) => this.mapToBoardResponseDto(board));
  }

  async getBoardById(boardId: string, userId: string): Promise<BoardResponseDto> {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException(`Board with ID ${boardId} not found`);
    }

    if (board.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this board');
    }

    return this.mapToBoardResponseDto(board);
  }

  async updateBoard(
    boardId: string,
    updateBoardDto: UpdateBoardDto,
    userId: string,
  ): Promise<BoardResponseDto> {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException(`Board with ID ${boardId} not found`);
    }

    if (board.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to update this board');
    }

    Object.assign(board, updateBoardDto);

    const updatedBoard = await this.boardRepository.save(board);
    return this.mapToBoardResponseDto(updatedBoard);
  }

  async deleteBoard(boardId: string, userId: string): Promise<void> {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException(`Board with ID ${boardId} not found`);
    }

    if (board.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this board');
    }

    await this.boardRepository.remove(board);
  }

  private mapToBoardResponseDto(board: Board): BoardResponseDto {
    return {
      id: board.id,
      title: board.title,
      description: board.description,
      thumbnail: board.thumbnail,
      ownerId: board.ownerId,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    };
  }
}
