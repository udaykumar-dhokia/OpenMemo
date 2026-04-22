import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey || typeof apiKey !== 'string') {
      throw new UnauthorizedException('API key is missing');
    }

    if (!apiKey.startsWith('om_')) {
      throw new UnauthorizedException('Invalid API key format');
    }

    const prefix = apiKey.substring(0, 7);
    const keys = await this.prisma.apiKey.findMany({
      where: { prefix },
    });

    for (const keyRecord of keys) {
      const isValid = await bcrypt.compare(apiKey, keyRecord.key);
      if (isValid) {
        const user = await this.prisma.user.findUnique({
          where: { id: keyRecord.userId },
        });
        request.user = user;
        return true;
      }
    }

    throw new UnauthorizedException('Invalid API key');
  }
}
