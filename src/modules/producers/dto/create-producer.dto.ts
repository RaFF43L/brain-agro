import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsCpfOrCnpj } from '../../../common/validators/is-cpf-or-cnpj.validator';

export class CreateProducerDto {
  @ApiProperty({ example: '52998224725', description: 'CPF ou CNPJ do produtor' })
  @IsString()
  @IsNotEmpty()
  @IsCpfOrCnpj({ message: 'CPF ou CNPJ inválido' })
  cpfCnpj!: string;

  @ApiProperty({ example: 'João Silva', description: 'Nome do produtor' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
