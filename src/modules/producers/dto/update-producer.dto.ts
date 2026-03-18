import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateProducerDto {
  @ApiPropertyOptional({ example: '12345678901', description: 'CPF ou CNPJ do produtor' })
  @IsString()
  @IsOptional()
  cpfCnpj?: string;

  @ApiPropertyOptional({ example: 'João Silva', description: 'Nome do produtor' })
  @IsString()
  @IsOptional()
  name?: string;
}
