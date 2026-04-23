import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { MemoriesService } from './memories.service.js';
import { CreateMemoryDto } from './dto/create-memory.dto.js';
import { AnyAuthGuard } from '../auth/guards/any-auth.guard.js';
import { GetUser } from '../common/decorators/get-user.decorator.js';
import * as Prisma from '@prisma/client';

@Controller('memories')
@UseGuards(AnyAuthGuard)
export class MemoriesController {
  constructor(private memoriesService: MemoriesService) {}

  @Post()
  async create(@GetUser() user: Prisma.User, @Body() dto: CreateMemoryDto) {
    return this.memoriesService.create(user.id, dto);
  }

  @Get()
  async findAll(@GetUser() user: Prisma.User, @Query('query') query?: string) {
    return this.memoriesService.findAll(user.id, query);
  }

  @Get(':id')
  async findOne(@GetUser() user: Prisma.User, @Param('id') id: string) {
    return this.memoriesService.findOne(user.id, id);
  }

  @Get('category/:category')
  async findByCategory(
    @GetUser() user: Prisma.User,
    @Param('category') category: Prisma.MemoryCategory,
  ) {
    return this.memoriesService.findByCategory(user.id, category);
  }

  @Delete(':id')
  async remove(@GetUser() user: Prisma.User, @Param('id') id: string) {
    return this.memoriesService.remove(user.id, id);
  }
}
