import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCropDto {
  @ApiPropertyOptional({ example: 'Safra 2025', description: 'Safra/temporada da cultura' })
  @IsString()
  @IsOptional()
  season?: string;

  @ApiPropertyOptional({ example: 'Milho', description: 'Tipo de cultura' })
  @IsString()
  @IsOptional()
  culture?: string;
}
