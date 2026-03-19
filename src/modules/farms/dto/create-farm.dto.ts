import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateFarmDto {
  @ApiProperty({ example: 'Fazenda Boa Vista', description: 'Nome da fazenda' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Ribeirão Preto', description: 'Cidade da fazenda' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ example: 'SP', description: 'Estado da fazenda' })
  @IsString()
  @IsNotEmpty()
  state!: string;

  @ApiProperty({ example: 1000, description: 'Área total em hectares' })
  @IsNumber()
  @IsPositive()
  totalArea!: number;

  @ApiProperty({ example: 600, description: 'Área agricultável em hectares' })
  @IsNumber()
  @Min(0)
  arableArea!: number;

  @ApiProperty({ example: 400, description: 'Área de vegetação em hectares' })
  @IsNumber()
  @Min(0)
  vegetationArea!: number;

  @ApiProperty({ example: 1, description: 'ID do produtor (opcional)', required: false })
  @IsOptional()
  @IsInt()
  @IsPositive()
  producerId?: number;
}
