import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';

export function FindAllProducersDocs() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Listar todos os produtores' }),
    ApiOkResponse({ description: 'Lista de produtores retornada com sucesso' }),
  );
}
