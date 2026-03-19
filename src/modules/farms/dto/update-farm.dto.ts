import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class UpdateFarmDto {
  @ApiPropertyOptional({ example: 'Fazenda Nova', description: 'Nome da fazenda' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Campinas', description: 'Cidade da fazenda' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'SP', description: 'Estado da fazenda' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: 1200, description: 'Área total em hectares' })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  totalArea?: number;

  @ApiPropertyOptional({ example: 700, description: 'Área agricultável em hectares' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  arableArea?: number;

  @ApiPropertyOptional({ example: 500, description: 'Área de vegetação em hectares' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  vegetationArea?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID do produtor associado' })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  producerId?: number;
}
