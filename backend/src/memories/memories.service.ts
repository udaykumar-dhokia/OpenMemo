import { MemoryCategory, Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import { GeminiService } from '../common/services/gemini.service.js';
import { splitText } from '../common/utils/text-splitter.js';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMemoryDto } from './dto/create-memory.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class MemoriesService {
  constructor(
    private prisma: PrismaService,
    private geminiService: GeminiService,
  ) {}

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

  private decryptWithKey(
    ciphertext: string,
    key: Buffer,
    iv: string,
    authTag: string,
  ): string {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(iv, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private encryptPrivateKey(
    privateKey: string,
    keySource: string,
    salt: string,
  ) {
    const key = crypto.scryptSync(keySource, salt, 32);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return {
      encryptedPrivateKey: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag,
    };
  }

  private async handleEmbeddings(
    memoryId: string,
    userId: string,
    content: string,
    summary: string,
    aesKey: Buffer,
  ) {
    try {
      await this.prisma.$executeRaw`
        DELETE FROM "MemoryEmbedding" WHERE "memoryId" = ${memoryId}::uuid
      `;

      const chunks = splitText(content, 1000, 100);
      if (summary && !chunks.includes(summary)) {
        chunks.push(summary);
      }

      for (const chunk of chunks) {
        const embedding = await this.geminiService.generateEmbedding(chunk);
        const encryptedChunk = this.encryptWithKey(chunk, aesKey);
        const vectorString = `[${embedding.join(',')}]`;

        await this.prisma.$executeRaw`
          INSERT INTO "MemoryEmbedding" ("id", "memoryId", "userId", "contentChunk", "chunkIv", "chunkTag", "embedding")
          VALUES (gen_random_uuid(), ${memoryId}::uuid, ${userId}::uuid, ${encryptedChunk.ciphertext}, ${encryptedChunk.iv}, ${encryptedChunk.authTag}, ${vectorString}::vector)
        `;
      }
    } catch (error) {
      console.error(
        `[EMBEDDING] Failed to handle embeddings: ${error.message}`,
      );
    }
  }

  async decryptMemory(memory: any) {
    if (!memory.encryptionKey) return memory;

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: memory.userId },
      });

      if (!user) {
        console.error(`[DECRYPT] User ${memory.userId} not found`);
        return memory;
      }

      const masterKey = crypto.scryptSync(
        user.password,
        user.encryptionSalt,
        32,
      );
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        masterKey,
        Buffer.from(user.privateKeyIv, 'hex'),
      );
      decipher.setAuthTag(Buffer.from(user.privateKeyTag, 'hex'));

      let privateKey: string;
      try {
        privateKey = decipher.update(user.privateKey, 'hex', 'utf8');
        privateKey += decipher.final('utf8');
      } catch (e) {
        throw new Error(`Failed to decrypt private key with stored hash: ${e.message}`);
      }

      console.log(`[DECRYPT] Private key decrypted successfully using hash`);
      const aesKey = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        Buffer.from(memory.encryptionKey, 'base64'),
      );
      console.log(`[DECRYPT] AES key decrypted successfully`);

      const content = this.decryptWithKey(
        memory.content,
        aesKey,
        memory.contentIv,
        memory.contentTag,
      );
      const summary = this.decryptWithKey(
        memory.summary,
        aesKey,
        memory.summaryIv,
        memory.summaryTag,
      );

      return {
        ...memory,
        content,
        summary,
      };
    } catch (error) {
      console.error(`[DECRYPT] Overall decryption failed for memory ${memory.id}: ${error.message}`);
      console.error(`[DECRYPT] Error Stack: ${error.stack}`);
      return memory;
    }
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

    const memoryPayload = {
      ...memoryData,
      content: encContent.ciphertext,
      contentIv: encContent.iv,
      contentTag: encContent.authTag,
      summary: encSummary.ciphertext,
      summaryIv: encSummary.iv,
      summaryTag: encSummary.authTag,
      encryptionKey: encryptedAesKey,
      category: dto.category,
      userId: userId,
    };

    if (dto.category) {
      const existing = await this.prisma.memory.findFirst({
        where: { userId, category: dto.category },
      });

      if (existing) {
        const updated = await this.prisma.memory.update({
          where: { id: existing.id },
          data: {
            ...memoryPayload,
            memoryTags: tags
              ? {
                  deleteMany: {},
                  create: tags.map((tag) => ({ tag })),
                }
              : undefined,
          },
          include: { memoryTags: true },
        });

        this.handleEmbeddings(
          updated.id,
          userId,
          dto.content,
          dto.summary,
          aesKey,
        );

        return this.decryptMemory(updated);
      }
    }

    const created = await this.prisma.memory.create({
      data: {
        ...memoryPayload,
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

    this.handleEmbeddings(created.id, userId, dto.content, dto.summary, aesKey);

    return this.decryptMemory(created);
  }

  async findAll(userId: string, query?: string) {
    if (query && !Object.values(MemoryCategory).includes(query as any)) {
      try {
        const queryEmbedding =
          await this.geminiService.generateEmbedding(query);
        const vectorString = `[${queryEmbedding.join(',')}]`;

        const results: any[] = await this.prisma.$queryRaw`
          SELECT m.*, 
                 1 - (me.embedding <=> ${vectorString}::vector) as similarity
          FROM "Memory" m
          JOIN "MemoryEmbedding" me ON m.id = me."memoryId"
          WHERE m."userId" = ${userId}::uuid
          ORDER BY similarity DESC
          LIMIT 10
        `;

        const uniqueResults = Array.from(
          new Map(results.map((item) => [item.id, item])).values(),
        );

        return Promise.all(uniqueResults.map((m) => this.decryptMemory(m)));
      } catch (error) {
        console.error(`[SEARCH] Semantic search failed: ${error.message}`);
      }
    }

    const memories = await this.prisma.memory.findMany({
      where: {
        userId,
        category:
          query && Object.values(MemoryCategory).includes(query as any)
            ? (query as MemoryCategory)
            : undefined,
        OR:
          query && !Object.values(MemoryCategory).includes(query as any)
            ? [{ title: { contains: query, mode: 'insensitive' } }]
            : undefined,
      },
      include: {
        memoryTags: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(memories.map((m) => this.decryptMemory(m)));
  }

  async findOne(userId: string, id: string) {
    const memory = await this.prisma.memory.findFirst({
      where: { id, userId },
      include: { memoryTags: true },
    });

    if (!memory) {
      throw new NotFoundException('Memory not found');
    }

    return this.decryptMemory(memory);
  }

  async findByCategory(userId: string, category: MemoryCategory) {
    const memory = await this.prisma.memory.findFirst({
      where: { userId, category },
      include: { memoryTags: true },
    });

    if (!memory) return null;

    return this.decryptMemory(memory);
  }

  async remove(userId: string, id: string) {
    await this.prisma.memory.delete({
      where: { id },
    });
    return { message: 'Memory deleted successfully' };
  }
}
