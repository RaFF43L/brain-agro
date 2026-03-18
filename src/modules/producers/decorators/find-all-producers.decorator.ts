import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

export function FindAllProducersDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Listar todos os produtores' }),
    ApiOkResponse({ description: 'Lista de produtores retornada com sucesso' }),
  );
}
