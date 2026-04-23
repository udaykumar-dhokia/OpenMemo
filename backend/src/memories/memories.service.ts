import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateMemoryDto } from './dto/create-memory.dto.js';
import { MemoryCategory } from '../../generated/prisma/client.js';
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

  async decryptMemory(memory: any, password?: string) {
    if (!memory.encryptionKey) return memory;

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: memory.userId },
      });

      if (!user) {
        console.error(`[DECRYPT] User ${memory.userId} not found`);
        return memory;
      }

      const tryDecrypt = (keySource: string) => {
        const masterKey = crypto.scryptSync(keySource, user.encryptionSalt, 32);
        const decipher = crypto.createDecipheriv(
          'aes-256-gcm',
          masterKey,
          Buffer.from(user.privateKeyIv, 'hex'),
        );
        decipher.setAuthTag(Buffer.from(user.privateKeyTag, 'hex'));
        let decrypted = decipher.update(user.privateKey, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      };

      let privateKey: string;
      try {
        console.log(`[DECRYPT] Attempting decryption with stored hash...`);
        privateKey = tryDecrypt(user.password);
      } catch (e) {
        console.log(`[DECRYPT] Hash decryption failed: ${e.message}`);
        if (password) {
          console.log(
            `[DECRYPT] Attempting decryption with provided plaintext password...`,
          );
          privateKey = tryDecrypt(password);

          try {
            console.log(
              `[DECRYPT] Plaintext worked! Migrating private key to hash-based encryption...`,
            );
            const { encryptedPrivateKey, iv, authTag } = this.encryptPrivateKey(
              privateKey,
              user.password,
              user.encryptionSalt,
            );
            await this.prisma.user.update({
              where: { id: user.id },
              data: {
                privateKey: encryptedPrivateKey,
                privateKeyIv: iv,
                privateKeyTag: authTag,
              },
            });
            console.log(
              `[DECRYPT] Successfully migrated user ${user.id} to hash-based encryption.`,
            );
          } catch (migrationError) {
            console.error(
              `[DECRYPT] Migration failed: ${migrationError.message}`,
            );
          }
        } else {
          throw new Error(
            'Decryption failed with hash and no plaintext password provided',
          );
        }
      }

      console.log(`[DECRYPT] Private key decrypted successfully`);
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
      console.error(`[DECRYPT] Overall decryption failed: ${error.message}`);
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
    return this.decryptMemory(created);
  }

  async findAll(userId: string, query?: string, password?: string) {
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

    if (password) {
      return Promise.all(memories.map((m) => this.decryptMemory(m, password)));
    }

    return memories;
  }

  async findOne(userId: string, id: string, password?: string) {
    const memory = await this.prisma.memory.findFirst({
      where: { id, userId },
      include: { memoryTags: true },
    });

    if (!memory) {
      throw new NotFoundException('Memory not found');
    }

    if (password) {
      return this.decryptMemory(memory, password);
    }

    return memory;
  }

  async findByCategory(
    userId: string,
    category: MemoryCategory,
    password?: string,
  ) {
    const memory = await this.prisma.memory.findFirst({
      where: { userId, category },
      include: { memoryTags: true },
    });

    if (!memory) return null;

    return this.decryptMemory(memory, password);
  }

  async remove(userId: string, id: string) {
    await this.prisma.memory.delete({
      where: { id },
    });
    return { message: 'Memory deleted successfully' };
  }
}
