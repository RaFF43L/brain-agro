import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class FilterFarmDto {
  @ApiPropertyOptional({ description: 'Nome da fazenda' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Cidade da fazenda' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'Estado da fazenda' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ description: 'Área total mínima' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalAreaMin?: number;

  @ApiPropertyOptional({ description: 'Área total máxima' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalAreaMax?: number;

  @ApiPropertyOptional({ description: 'ID do produtor' })
  @IsInt()
  @IsPositive()
  @IsOptional()
  producerId?: number;
}

export class FilterDateDto {
  @ApiPropertyOptional({
    description: 'Data inicial (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsOptional()
  @Type(() => Date) // Transforma a string "2024-01-01" em objeto Date
  @IsDate()
  initialDate?: Date;

  @ApiPropertyOptional({
    description: 'Data final (YYYY-MM-DD)',
    example: '2024-12-31',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  finalDate?: Date;
}
