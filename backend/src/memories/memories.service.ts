import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateMemoryDto } from './dto/create-memory.dto.js';
import * as crypto from 'crypto';

@Injectable()
export class MemoriesService {
  constructor(private prisma: PrismaService) {}

  private encryptWithKey(
    data: string,
    key: Buffer,
  ): { ciphertext: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return {
      ciphertext: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag,
    };
  }

  async create(userId: string, dto: CreateMemoryDto) {
    const { tags, ...memoryData } = dto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { publicKey: true },
    });

    if (!user || !user.publicKey) {
      throw new NotFoundException('User public key not found');
    }

    const aesKey = crypto.randomBytes(32);
    const encryptedAesKey = crypto
      .publicEncrypt(
        {
          key: user.publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        aesKey,
      )
      .toString('base64');

    const encContent = this.encryptWithKey(dto.content, aesKey);
    const encSummary = this.encryptWithKey(dto.summary, aesKey);

    return this.prisma.memory.create({
      data: {
        ...memoryData,
        content: encContent.ciphertext,
        contentIv: encContent.iv,
        contentTag: encContent.authTag,
        summary: encSummary.ciphertext,
        summaryIv: encSummary.iv,
        summaryTag: encSummary.authTag,
        encryptionKey: encryptedAesKey,
        userId: userId,
        memoryTags: tags
          ? {
              create: tags.map((tag) => ({ tag })),
            }
          : undefined,
      },
      include: {
        memoryTags: true,
      },
    });
  }

  async findAll(userId: string, query?: string) {
    return this.prisma.memory.findMany({
      where: {
        userId,
        OR: query
          ? [{ title: { contains: query, mode: 'insensitive' } }]
          : undefined,
      },
      include: {
        memoryTags: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const memory = await this.prisma.memory.findFirst({
      where: { id, userId },
      include: { memoryTags: true },
    });

    if (!memory) {
      throw new NotFoundException('Memory not found');
    }

    return memory;
  }

  async remove(userId: string, id: string) {
    await this.prisma.memory.delete({
      where: { id },
    });
    return { message: 'Memory deleted successfully' };
  }
}
