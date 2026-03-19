import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateCropDto {
  @ApiPropertyOptional({
    example: 'Safra 2025',
    description: 'Safra/temporada da cultura',
  })
  @IsString()
  @IsOptional()
  season?: string;

  @ApiPropertyOptional({ example: 'Milho', description: 'Tipo de cultura' })
  @IsString()
  @IsOptional()
  culture?: string;

  @ApiProperty({ example: 1, description: 'ID da fazenda' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  farmId!: number;
}
