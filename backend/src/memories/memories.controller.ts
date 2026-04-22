import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MemoriesService } from './memories.service.js';
import { CreateMemoryDto } from './dto/create-memory.dto.js';
import { AnyAuthGuard } from '../auth/guards/any-auth.guard.js';
import { GetUser } from '../common/decorators/get-user.decorator.js';
import * as PrismaClient from '../../generated/prisma/client.js';

@Controller('memories')
@UseGuards(AnyAuthGuard)
export class MemoriesController {
  constructor(private memoriesService: MemoriesService) {}

  @Post()
  async create(
    @GetUser() user: PrismaClient.User,
    @Body() dto: CreateMemoryDto,
  ) {
    return this.memoriesService.create(user.id, dto);
  }

  @Get()
  async findAll(
    @GetUser() user: PrismaClient.User,
    @Query('query') query?: string,
  ) {
    return this.memoriesService.findAll(user.id, query);
  }

  @Get(':id')
  async findOne(@GetUser() user: PrismaClient.User, @Param('id') id: string) {
    return this.memoriesService.findOne(user.id, id);
  }

  @Delete(':id')
  async remove(@GetUser() user: PrismaClient.User, @Param('id') id: string) {
    return this.memoriesService.remove(user.id, id);
  }
}
