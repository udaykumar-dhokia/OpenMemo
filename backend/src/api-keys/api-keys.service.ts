import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateApiKeyDto } from './dto/create-api-key.dto.js';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateApiKeyDto) {
    const rawPart = crypto.randomBytes(24).toString('hex');
    const fullKey = `om_${rawPart}`;
    const prefix = fullKey.substring(0, 7);

    const hashedKey = await bcrypt.hash(fullKey, 10);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        name: dto.name || 'Default Key',
        key: hashedKey,
        prefix: prefix,
        userId: userId,
      },
    });

    return {
      id: apiKey.id,
      name: apiKey.name,
      apiKey: fullKey,
      prefix: apiKey.prefix,
      createdAt: apiKey.createdAt,
    };
  }

  async findAll(userId: string) {
    return this.prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        prefix: true,
        createdAt: true,
      },
    });
  }

  async remove(userId: string, id: string) {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id, userId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    await this.prisma.$transaction([
      this.prisma.archivedApiKey.create({
        data: {
          name: apiKey.name,
          key: apiKey.key,
          prefix: apiKey.prefix,
          userId: apiKey.userId,
        },
      }),
      this.prisma.apiKey.delete({
        where: { id },
      }),
    ]);

    return { message: 'API key archived successfully' };
  }
}
