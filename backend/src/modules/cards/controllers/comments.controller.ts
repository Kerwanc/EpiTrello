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
import { CommentsService } from '../services/comments.service';
import { JwtGuard } from '../../../common/guards/jwt.guard';
import { ResourcePermissionGuard } from '../../boards/guards/resource-permission.guard';
import { RequireBoardPermission } from '../../boards/decorators/require-board-permission.decorator';
import { BoardPermission } from '../../boards/services/board-permission.service';
import { CreateCommentDto } from '../dtos/create-comment.dto';
import { UpdateCommentDto } from '../dtos/update-comment.dto';
import { CommentResponseDto } from '../dtos/comment-response.dto';

@Controller('lists/:listId/cards/:cardId/comments')
@UseGuards(JwtGuard)
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Post()
  @UseGuards(ResourcePermissionGuard)
  @RequireBoardPermission(BoardPermission.EDIT)
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Param('cardId') cardId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Request() req,
  ): Promise<CommentResponseDto> {
    const authorId = req.user.id;
    return this.commentsService.createComment(
      cardId,
      authorId,
      createCommentDto,
    );
  }

  @Get()
  @UseGuards(ResourcePermissionGuard)
  @RequireBoardPermission(BoardPermission.VIEW)
  async getCommentsByCard(
    @Param('cardId') cardId: string,
    @Request() req,
  ): Promise<CommentResponseDto[]> {
    const userId = req.user.id;
    return this.commentsService.getCommentsByCard(cardId, userId);
  }

  @Patch(':commentId')
  @UseGuards(ResourcePermissionGuard)
  @RequireBoardPermission(BoardPermission.VIEW)
  async updateComment(
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Request() req,
  ): Promise<CommentResponseDto> {
    const authorId = req.user.id;
    return this.commentsService.updateComment(
      commentId,
      authorId,
      updateCommentDto,
    );
  }

  @Delete(':commentId')
  @UseGuards(ResourcePermissionGuard)
  @RequireBoardPermission(BoardPermission.VIEW)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(
    @Param('commentId') commentId: string,
    @Param('cardId') cardId: string,
    @Request() req,
  ): Promise<void> {
    const userId = req.user.id;
    await this.commentsService.deleteComment(commentId, userId, cardId);
  }
}
