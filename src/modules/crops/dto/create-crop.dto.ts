import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class CreateCropDto {
  @ApiProperty({ example: 'Safra 2024', description: 'Safra/temporada da cultura' })
  @IsString()
  @IsNotEmpty()
  season!: string;

  @ApiProperty({ example: 'Soja', description: 'Tipo de cultura' })
  @IsString()
  @IsNotEmpty()
  culture!: string;

  @ApiProperty({ example: 1, description: 'ID da fazenda' })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  farmId!: number;
}
