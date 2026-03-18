import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateProducerDto {
  @ApiProperty({ example: '12345678901', description: 'CPF ou CNPJ do produtor' })
  @IsString()
  @IsNotEmpty()
  cpfCnpj!: string;

  @ApiProperty({ example: 'João Silva', description: 'Nome do produtor' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
