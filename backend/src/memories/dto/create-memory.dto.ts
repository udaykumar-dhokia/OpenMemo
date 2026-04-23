import { IsString, IsOptional, IsNumber, IsArray, IsEnum } from 'class-validator';
import { MemoryCategory } from '@prisma/client';

export class CreateMemoryDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  content: string;

  @IsString()
  summary: string;  

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
