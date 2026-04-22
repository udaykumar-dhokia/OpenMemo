import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { GetUser } from '../common/decorators/get-user.decorator.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import * as PrismaClient from '../../generated/prisma/client.js';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getMe(@GetUser() user: PrismaClient.User) {
    return this.usersService.findOne(user.id);
  }

  @Patch('me')
  async updateMe(
    @GetUser() user: PrismaClient.User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(user.id, updateUserDto);
  }

  @Delete('me')
  async deleteMe(@GetUser() user: PrismaClient.User) {
    return this.usersService.remove(user.id);
  }
}
