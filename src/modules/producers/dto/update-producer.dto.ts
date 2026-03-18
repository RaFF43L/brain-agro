import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { IsCpfOrCnpj } from '../../../common/validators/is-cpf-or-cnpj.validator';

export class UpdateProducerDto {
  @ApiPropertyOptional({ example: '52998224725', description: 'CPF ou CNPJ do produtor' })
  @IsString()
  @IsOptional()
  @IsCpfOrCnpj({ message: 'CPF ou CNPJ inválido' })
  cpfCnpj?: string;

  @ApiPropertyOptional({ example: 'João Silva', description: 'Nome do produtor' })
  @IsString()
  @IsOptional()
  name?: string;
}
