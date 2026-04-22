import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';

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
