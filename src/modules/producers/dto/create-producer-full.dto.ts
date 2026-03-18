import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsCpfOrCnpj } from '../../../common/validators/is-cpf-or-cnpj.validator';

class CreateCropInput {
  @ApiProperty({ example: 'Safra 2021' })
  @IsString()
  @IsNotEmpty()
  season!: string;

  @ApiProperty({ example: 'Soja' })
  @IsString()
  @IsNotEmpty()
  culture!: string;
}

class CreateFarmInput {
  @ApiProperty({ example: 'Fazenda Boa Vista' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Ribeirão Preto' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ example: 'SP' })
  @IsString()
  @IsNotEmpty()
  state!: string;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Min(0)
  totalArea!: number;

  @ApiProperty({ example: 600 })
  @IsNumber()
  @Min(0)
  arableArea!: number;

  @ApiProperty({ example: 400 })
  @IsNumber()
  @Min(0)
  vegetationArea!: number;

  @ApiPropertyOptional({ type: [CreateCropInput] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateCropInput)
  crops?: CreateCropInput[];
}

export class CreateProducerFullDto {
  @ApiProperty({ example: '52998224725', description: 'CPF ou CNPJ do produtor' })
  @IsString()
  @IsNotEmpty()
  @IsCpfOrCnpj({ message: 'CPF ou CNPJ inválido' })
  cpfCnpj!: string;

  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ type: [CreateFarmInput] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateFarmInput)
  farms?: CreateFarmInput[];
}
