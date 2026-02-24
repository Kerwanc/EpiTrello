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
import { BoardPermissionGuard } from '../guards/board-permission.guard';
import { RequireBoardPermission } from '../decorators/require-board-permission.decorator';
import { BoardPermission } from '../services/board-permission.service';
import { CreateBoardDto } from '../dtos/create-board.dto';
import { UpdateBoardDto } from '../dtos/update-board.dto';
import { BoardResponseDto } from '../dtos/board-response.dto';
import { InviteBoardMemberDto } from '../dtos/invite-board-member.dto';
import { UpdateBoardMemberDto } from '../dtos/update-board-member.dto';
import { BoardMemberResponseDto } from '../dtos/board-member-response.dto';

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
  @UseGuards(BoardPermissionGuard)
  @RequireBoardPermission(BoardPermission.VIEW)
  async getBoardById(
    @Param('id') boardId: string,
    @Request() req,
  ): Promise<BoardResponseDto> {
    const userId = req.user.id;
    return this.boardsService.getBoardById(boardId, userId);
  }

  @Patch(':id')
  @UseGuards(BoardPermissionGuard)
  @RequireBoardPermission(BoardPermission.EDIT)
  async updateBoard(
    @Param('id') boardId: string,
    @Body() updateBoardDto: UpdateBoardDto,
    @Request() req,
  ): Promise<BoardResponseDto> {
    const userId = req.user.id;
    return this.boardsService.updateBoard(boardId, updateBoardDto, userId);
  }

  @Delete(':id')
  @UseGuards(BoardPermissionGuard)
  @RequireBoardPermission(BoardPermission.DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBoard(
    @Param('id') boardId: string,
    @Request() req,
  ): Promise<void> {
    const userId = req.user.id;
    await this.boardsService.deleteBoard(boardId, userId);
  }

  @Post(':boardId/members')
  @UseGuards(BoardPermissionGuard)
  @RequireBoardPermission(BoardPermission.INVITE_MEMBERS)
  @HttpCode(HttpStatus.CREATED)
  async inviteBoardMember(
    @Param('boardId') boardId: string,
    @Body() inviteMemberDto: InviteBoardMemberDto,
    @Request() req,
  ): Promise<BoardMemberResponseDto> {
    const userId = req.user.id;
    return this.boardsService.inviteMember(
      boardId,
      inviteMemberDto.username,
      inviteMemberDto.role,
      userId,
    );
  }

  @Get(':boardId/members')
  @UseGuards(BoardPermissionGuard)
  @RequireBoardPermission(BoardPermission.VIEW)
  async getBoardMembers(
    @Param('boardId') boardId: string,
    @Request() req,
  ): Promise<BoardMemberResponseDto[]> {
    const userId = req.user.id;
    return this.boardsService.getBoardMembers(boardId, userId);
  }

  @Patch(':boardId/members/:memberId')
  @UseGuards(BoardPermissionGuard)
  @RequireBoardPermission(BoardPermission.MANAGE_MEMBERS)
  async updateMemberRole(
    @Param('boardId') boardId: string,
    @Param('memberId') memberId: string,
    @Body() updateMemberDto: UpdateBoardMemberDto,
    @Request() req,
  ): Promise<BoardMemberResponseDto> {
    const userId = req.user.id;
    return this.boardsService.updateMemberRole(
      boardId,
      memberId,
      updateMemberDto.role,
      userId,
    );
  }

  @Delete(':boardId/members/:memberId')
  @UseGuards(BoardPermissionGuard)
  @RequireBoardPermission(BoardPermission.MANAGE_MEMBERS)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeBoardMember(
    @Param('boardId') boardId: string,
    @Param('memberId') memberId: string,
    @Request() req,
  ): Promise<void> {
    const userId = req.user.id;
    await this.boardsService.removeMember(boardId, memberId, userId);
  }
}
