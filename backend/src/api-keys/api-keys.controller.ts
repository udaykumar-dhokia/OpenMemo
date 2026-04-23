import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service.js';
import { CreateApiKeyDto } from './dto/create-api-key.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { GetUser } from '../common/decorators/get-user.decorator.js';
import * as Prisma from '@prisma/client';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private apiKeysService: ApiKeysService) {}

  @Post()
  async create(
    @GetUser() user: Prisma.User,
    @Body() dto: CreateApiKeyDto,
  ) {
    return this.apiKeysService.create(user.id, dto);
  }

  @Get()
  async findAll(@GetUser() user: Prisma.User) {
    return this.apiKeysService.findAll(user.id);
  }

  @Delete(':id')
  async remove(@GetUser() user: Prisma.User, @Param('id') id: string) {
    return this.apiKeysService.remove(user.id, id);
  }
}
