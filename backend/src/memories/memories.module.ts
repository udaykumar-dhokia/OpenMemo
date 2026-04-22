import { Module } from '@nestjs/common';
import { MemoriesService } from './memories.service.js';
import { MemoriesController } from './memories.controller.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ApiKeyGuard } from '../auth/guards/api-key.guard.js';
import { AnyAuthGuard } from '../auth/guards/any-auth.guard.js';

@Module({
  providers: [MemoriesService, JwtAuthGuard, ApiKeyGuard, AnyAuthGuard],
  controllers: [MemoriesController],
  exports: [MemoriesService],
})
export class MemoriesModule {}
