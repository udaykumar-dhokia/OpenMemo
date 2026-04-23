import { Module, Global } from '@nestjs/common';
import { GeminiService } from './services/gemini.service.js';

@Global()
@Module({
  providers: [GeminiService],
  exports: [GeminiService],
})
export class CommonModule {}
