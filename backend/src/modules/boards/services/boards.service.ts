import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board } from '../entities/board.entity';
import { BoardMember, BoardRole } from '../entities/board-member.entity';
import { CreateBoardDto } from '../dtos/create-board.dto';
import { UpdateBoardDto } from '../dtos/update-board.dto';
import { BoardResponseDto } from '../dtos/board-response.dto';
import { BoardWithRoleDto } from '../dtos/board-with-role.dto';
import { BoardMemberResponseDto } from '../dtos/board-member-response.dto';
import { UserService } from '../../users/services/user.service';

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private boardRepository: Repository<Board>,
    @InjectRepository(BoardMember)
    private boardMemberRepository: Repository<BoardMember>,
    private userService: UserService,
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

  async getAllUserBoards(userId: string): Promise<BoardWithRoleDto[]> {
    const ownedBoards = await this.boardRepository
      .createQueryBuilder('board')
      .leftJoinAndSelect('board.members', 'member')
      .where('board.ownerId = :userId', { userId })
      .orderBy('board.createdAt', 'DESC')
      .getMany();

    const memberBoards = await this.boardRepository
      .createQueryBuilder('board')
      .leftJoinAndSelect('board.members', 'member')
      .leftJoin('board.members', 'userMember')
      .where('userMember.userId = :userId', { userId })
      .andWhere('board.ownerId != :userId', { userId })
      .orderBy('board.updatedAt', 'DESC')
      .getMany();

    const ownedBoardDtos = ownedBoards.map((board) =>
      this.mapToBoardWithRoleDto(board, 'owner'),
    );

    // Map member boards with their respective roles
    const memberBoardDtos = await Promise.all(
      memberBoards.map(async (board) => {
        const membership = await this.boardMemberRepository.findOne({
          where: { boardId: board.id, userId },
        });
        return this.mapToBoardWithRoleDto(
          board,
          membership?.role || BoardRole.VISITOR,
        );
      }),
    );

    // Return owned boards first, then member boards
    return [...ownedBoardDtos, ...memberBoardDtos];
  }

  async getBoardById(
    boardId: string,
    userId: string,
  ): Promise<BoardWithRoleDto> {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
      relations: ['members'],
    });

    if (!board) {
      throw new NotFoundException(`Board with ID ${boardId} not found`);
    }

    // Check if user is owner
    if (board.ownerId === userId) {
      return this.mapToBoardWithRoleDto(board, 'owner');
    }

    // Check if user is a member
    const membership = await this.boardMemberRepository.findOne({
      where: { boardId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this board');
    }

    return this.mapToBoardWithRoleDto(board, membership.role);
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
      throw new ForbiddenException(
        'You do not have permission to update this board',
      );
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
      throw new ForbiddenException(
        'You do not have permission to delete this board',
      );
    }

    await this.boardRepository.remove(board);
  }

  async inviteMember(
    boardId: string,
    username: string,
    role: string,
    inviterId: string,
  ): Promise<BoardMemberResponseDto> {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException(`Board with ID ${boardId} not found`);
    }

    if (board.ownerId !== inviterId) {
      throw new ForbiddenException('Only the board owner can invite members');
    }

    const user = await this.userService.getUserByUsername(username);
    if (!user) {
      throw new NotFoundException(`User with username ${username} not found`);
    }

    const existingMember = await this.boardMemberRepository.findOne({
      where: { boardId, userId: user.id },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this board');
    }

    const boardMember = this.boardMemberRepository.create({
      boardId,
      userId: user.id,
      role: role as any,
    });

    const savedMember = await this.boardMemberRepository.save(boardMember);

    return {
      id: savedMember.id,
      boardId: savedMember.boardId,
      userId: savedMember.userId,
      role: savedMember.role,
      createdAt: savedMember.createdAt,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl || null,
      },
    };
  }

  async getBoardMembers(
    boardId: string,
    userId: string,
  ): Promise<BoardMemberResponseDto[]> {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException(`Board with ID ${boardId} not found`);
    }

    const isMember = await this.boardMemberRepository.findOne({
      where: { boardId, userId },
    });

    if (board.ownerId !== userId && !isMember) {
      throw new ForbiddenException('You do not have access to this board');
    }

    const members = await this.boardMemberRepository.find({
      where: { boardId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    return members.map((member) => ({
      id: member.id,
      boardId: member.boardId,
      userId: member.userId,
      role: member.role,
      createdAt: member.createdAt,
      user: {
        id: member.user.id,
        username: member.user.username,
        email: member.user.email,
        avatarUrl: member.user.avatarUrl,
      },
    }));
  }

  async updateMemberRole(
    boardId: string,
    memberId: string,
    newRole: string,
    requesterId: string,
  ): Promise<BoardMemberResponseDto> {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException(`Board with ID ${boardId} not found`);
    }

    if (board.ownerId !== requesterId) {
      throw new ForbiddenException('Only the board owner can change roles');
    }

    const member = await this.boardMemberRepository.findOne({
      where: { id: memberId, boardId },
      relations: ['user'],
    });

    if (!member) {
      throw new NotFoundException('Board member not found');
    }

    member.role = newRole as any;
    const updatedMember = await this.boardMemberRepository.save(member);

    return {
      id: updatedMember.id,
      boardId: updatedMember.boardId,
      userId: updatedMember.userId,
      role: updatedMember.role,
      createdAt: updatedMember.createdAt,
      user: {
        id: updatedMember.user.id,
        username: updatedMember.user.username,
        email: updatedMember.user.email,
        avatarUrl: updatedMember.user.avatarUrl,
      },
    };
  }

  async removeMember(
    boardId: string,
    memberId: string,
    requesterId: string,
  ): Promise<void> {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException(`Board with ID ${boardId} not found`);
    }

    if (board.ownerId !== requesterId) {
      throw new ForbiddenException('Only the board owner can remove members');
    }

    const member = await this.boardMemberRepository.findOne({
      where: { id: memberId, boardId },
    });

    if (!member) {
      throw new NotFoundException('Board member not found');
    }

    if (member.userId === board.ownerId) {
      throw new BadRequestException(
        'Cannot remove the board owner from members',
      );
    }

    await this.boardMemberRepository.remove(member);
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

  private mapToBoardWithRoleDto(
    board: Board,
    userRole: BoardRole | 'owner',
  ): BoardWithRoleDto {
    // Count members: include board members + owner (1)
    const memberCount = (board.members?.length || 0) + 1;

    return {
      id: board.id,
      title: board.title,
      description: board.description,
      thumbnail: board.thumbnail,
      ownerId: board.ownerId,
      userRole,
      memberCount,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    };
  }
}
