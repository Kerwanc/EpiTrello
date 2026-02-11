import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BoardsService } from '../services/boards.service';
import { JwtGuard } from '../../../common/guards/jwt.guard';
import { CreateBoardDto } from '../dtos/create-board.dto';
import { UpdateBoardDto } from '../dtos/update-board.dto';
import { BoardResponseDto } from '../dtos/board-response.dto';

@Controller('boards')
@UseGuards(JwtGuard)
export class BoardsController {
  constructor(private boardsService: BoardsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBoard(
    @Body() createBoardDto: CreateBoardDto,
    @Request() req,
  ): Promise<BoardResponseDto> {
    const userId = req.user.id;
    return this.boardsService.createBoard(createBoardDto, userId);
  }

  @Get()
  async getAllUserBoards(@Request() req): Promise<BoardResponseDto[]> {
    const userId = req.user.id;
    return this.boardsService.getAllUserBoards(userId);
  }

  @Get(':id')
  async getBoardById(
    @Param('id') boardId: string,
    @Request() req,
  ): Promise<BoardResponseDto> {
    const userId = req.user.id;
    return this.boardsService.getBoardById(boardId, userId);
  }

  @Patch(':id')
  async updateBoard(
    @Param('id') boardId: string,
    @Body() updateBoardDto: UpdateBoardDto,
    @Request() req,
  ): Promise<BoardResponseDto> {
    const userId = req.user.id;
    return this.boardsService.updateBoard(boardId, updateBoardDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBoard(@Param('id') boardId: string, @Request() req): Promise<void> {
    const userId = req.user.id;
    await this.boardsService.deleteBoard(boardId, userId);
  }
}
