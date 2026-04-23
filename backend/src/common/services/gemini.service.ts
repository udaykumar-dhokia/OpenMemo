import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not defined in environment variables');
    }
    this.genAI = new GoogleGenAI({ apiKey: apiKey || '' });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const result = await this.genAI.models.embedContent({
        model: 'gemini-embedding-2',
        contents: [{ parts: [{ text }] }],
        config: {
          outputDimensionality: 1536,
        },
      });
      return result.embeddings?.[0]?.values || [];
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }
}
