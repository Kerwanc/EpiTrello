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
import { ListsService } from '../services/lists.service';
import { JwtGuard } from '../../../common/guards/jwt.guard';
import { ResourcePermissionGuard } from '../../boards/guards/resource-permission.guard';
import { RequireBoardPermission } from '../../boards/decorators/require-board-permission.decorator';
import { BoardPermission } from '../../boards/services/board-permission.service';
import { CreateListDto } from '../dtos/create-list.dto';
import { UpdateListDto } from '../dtos/update-list.dto';
import { ListResponseDto } from '../dtos/list-response.dto';

@Controller('boards/:boardId/lists')
@UseGuards(JwtGuard)
export class ListsController {
  constructor(private listsService: ListsService) {}

  @Post()
  @UseGuards(ResourcePermissionGuard)
  @RequireBoardPermission(BoardPermission.EDIT)
  @HttpCode(HttpStatus.CREATED)
  async createList(
    @Param('boardId') boardId: string,
    @Body() createListDto: CreateListDto,
    @Request() req,
  ): Promise<ListResponseDto> {
    const userId = req.user.id;
    return this.listsService.createList(boardId, createListDto, userId);
  }

  @Get()
  @UseGuards(ResourcePermissionGuard)
  @RequireBoardPermission(BoardPermission.VIEW)
  async getAllListsInBoard(
    @Param('boardId') boardId: string,
    @Request() req,
  ): Promise<ListResponseDto[]> {
    const userId = req.user.id;
    return this.listsService.getAllListsInBoard(boardId, userId);
  }

  @Get(':id')
  @UseGuards(ResourcePermissionGuard)
  @RequireBoardPermission(BoardPermission.VIEW)
  async getListById(
    @Param('id') listId: string,
    @Request() req,
  ): Promise<ListResponseDto> {
    const userId = req.user.id;
    return this.listsService.getListById(listId, userId);
  }

  @Patch(':id')
  @UseGuards(ResourcePermissionGuard)
  @RequireBoardPermission(BoardPermission.EDIT)
  async updateList(
    @Param('id') listId: string,
    @Body() updateListDto: UpdateListDto,
    @Request() req,
  ): Promise<ListResponseDto> {
    const userId = req.user.id;
    return this.listsService.updateList(listId, updateListDto, userId);
  }

  @Delete(':id')
  @UseGuards(ResourcePermissionGuard)
  @RequireBoardPermission(BoardPermission.EDIT)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteList(@Param('id') listId: string, @Request() req): Promise<void> {
    const userId = req.user.id;
    await this.listsService.deleteList(listId, userId);
  }
}
