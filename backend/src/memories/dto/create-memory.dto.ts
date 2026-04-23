import { IsString, IsOptional, IsNumber, IsArray, IsEnum } from 'class-validator';
import { MemoryCategory } from '../../../generated/prisma/client.js';

export class CreateMemoryDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  content: string;

  @IsString()
  summary: string;  

  @IsString()
  vectorId: string;

  @IsEnum(MemoryCategory)
  category: MemoryCategory;

  @IsString()
  @IsOptional()
  format?: string;

  @IsNumber()
  @IsOptional()
  importanceScore?: number;

  @IsArray()
  @IsOptional()
  tags?: string[];
}
