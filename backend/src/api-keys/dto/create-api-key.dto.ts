import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;
}
