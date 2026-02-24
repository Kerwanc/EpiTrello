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
import { CardsService } from '../services/cards.service';
import { JwtGuard } from '../../../common/guards/jwt.guard';
import { ResourcePermissionGuard } from '../../boards/guards/resource-permission.guard';
import { RequireBoardPermission } from '../../boards/decorators/require-board-permission.decorator';
import { BoardPermission } from '../../boards/services/board-permission.service';
import { CreateCardDto } from '../dtos/create-card.dto';
import { UpdateCardDto } from '../dtos/update-card.dto';
import { CardResponseDto } from '../dtos/card-response.dto';

@Controller('lists/:listId/cards')
@UseGuards(JwtGuard)
export class CardsController {
  constructor(private cardsService: CardsService) {}

  @Post()
  @UseGuards(ResourcePermissionGuard)
  @RequireBoardPermission(BoardPermission.EDIT)
  @HttpCode(HttpStatus.CREATED)
  async createCard(
    @Param('listId') listId: string,
    @Body() createCardDto: CreateCardDto,
    @Request() req,
  ): Promise<CardResponseDto> {
    const userId = req.user.id;
    return this.cardsService.createCard(listId, createCardDto, userId);
  }

  @Get()
  @UseGuards(ResourcePermissionGuard)
  @RequireBoardPermission(BoardPermission.VIEW)
  async getAllCardsInList(
    @Param('listId') listId: string,
    @Request() req,
  ): Promise<CardResponseDto[]> {
    const userId = req.user.id;
    return this.cardsService.getAllCardsInList(listId, userId);
  }

  @Get(':id')
  @UseGuards(ResourcePermissionGuard)
  @RequireBoardPermission(BoardPermission.VIEW)
  async getCardById(
    @Param('id') cardId: string,
    @Request() req,
  ): Promise<CardResponseDto> {
    const userId = req.user.id;
    return this.cardsService.getCardById(cardId, userId);
  }

  @Patch(':id')
  @UseGuards(ResourcePermissionGuard)
  @RequireBoardPermission(BoardPermission.EDIT)
  async updateCard(
    @Param('id') cardId: string,
    @Body() updateCardDto: UpdateCardDto,
    @Request() req,
  ): Promise<CardResponseDto> {
    const userId = req.user.id;
    return this.cardsService.updateCard(cardId, updateCardDto, userId);
  }

  @Delete(':id')
  @UseGuards(ResourcePermissionGuard)
  @RequireBoardPermission(BoardPermission.EDIT)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCard(@Param('id') cardId: string, @Request() req): Promise<void> {
    const userId = req.user.id;
    await this.cardsService.deleteCard(cardId, userId);
  }
}
