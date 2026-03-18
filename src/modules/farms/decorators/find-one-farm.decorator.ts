import { applyDecorators } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';

export function FindOneFarmDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Buscar uma fazenda pelo ID' }),
    ApiParam({ name: 'id', type: Number, description: 'ID da fazenda' }),
    ApiOkResponse({ description: 'Fazenda encontrada' }),
    ApiNotFoundResponse({ description: 'Fazenda não encontrada' }),
  );
}
