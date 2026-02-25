import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { Card } from '../entities/card.entity';
import { BoardPermissionService } from '../../boards/services/board-permission.service';
import { CreateCommentDto } from '../dtos/create-comment.dto';
import { UpdateCommentDto } from '../dtos/update-comment.dto';
import {
  CommentResponseDto,
  CommentAuthorDto,
} from '../dtos/comment-response.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(Card)
    private cardRepository: Repository<Card>,
    private boardPermissionService: BoardPermissionService,
  ) {}

  async createComment(
    cardId: string,
    authorId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['list'],
    });

    if (!card) {
      throw new NotFoundException(`Card with ID ${cardId} not found`);
    }

    const comment = this.commentRepository.create({
      content: createCommentDto.content,
      cardId,
      authorId,
    });

    const savedComment = await this.commentRepository.save(comment);

    const commentWithAuthor = await this.commentRepository.findOne({
      where: { id: savedComment.id },
      relations: ['author'],
    });

    return this.mapToCommentResponseDto(commentWithAuthor!);
  }

  async getCommentsByCard(
    cardId: string,
    _userId: string,
  ): Promise<CommentResponseDto[]> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
    });

    if (!card) {
      throw new NotFoundException(`Card with ID ${cardId} not found`);
    }

    const comments = await this.commentRepository.find({
      where: { cardId },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });

    return comments.map((comment) => this.mapToCommentResponseDto(comment));
  }

  async updateComment(
    commentId: string,
    authorId: string,
    updateCommentDto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['author'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${commentId} not found`);
    }

    if (comment.authorId !== authorId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    comment.content = updateCommentDto.content;
    const updatedComment = await this.commentRepository.save(comment);

    return this.mapToCommentResponseDto(updatedComment);
  }

  async deleteComment(
    commentId: string,
    userId: string,
    _cardId: string,
  ): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['card', 'card.list'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${commentId} not found`);
    }

    const isAuthor = comment.authorId === userId;

    if (!isAuthor) {
      const boardId = comment.card.list.boardId;
      const canEdit = await this.boardPermissionService.canEditBoard(
        userId,
        boardId,
      );

      if (!canEdit) {
        throw new ForbiddenException(
          'You can only delete your own comments unless you are a moderator or owner',
        );
      }
    }

    await this.commentRepository.remove(comment);
  }

  async getCommentById(commentId: string): Promise<Comment | null> {
    return this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['author'],
    });
  }

  private mapToCommentResponseDto(comment: Comment): CommentResponseDto {
    const isEdited =
      comment.updatedAt.getTime() > comment.createdAt.getTime() + 1000;
    const authorDto: CommentAuthorDto = {
      id: comment.author.id,
      username: comment.author.username,
      email: comment.author.email,
      avatarUrl: comment.author.avatarUrl,
    };

    return {
      id: comment.id,
      content: comment.content,
      cardId: comment.cardId,
      authorId: comment.authorId,
      author: authorDto,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      isEdited,
    };
  }
}
