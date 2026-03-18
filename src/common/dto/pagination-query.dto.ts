import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Número da página', default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Itens por página', default: 10 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Campo para ordenação', example: 'name' })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Direção da ordenação', enum: ['ASC', 'DESC'], default: 'ASC' })
  @IsIn(['ASC', 'DESC'])
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'ASC';

  @ApiPropertyOptional({ description: 'Filtro por texto (busca parcial)' })
  @IsString()
  @IsOptional()
  search?: string;
}

export class CursorPaginationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Cursor para paginação keyset (ID do último item)' })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  cursor?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    nextCursor?: number | null;
  };
}
