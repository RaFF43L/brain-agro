import { applyDecorators } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';

export function FindOneProducerDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Buscar um produtor pelo ID' }),
    ApiParam({ name: 'id', type: Number, description: 'ID do produtor' }),
    ApiOkResponse({ description: 'Produtor encontrado' }),
    ApiNotFoundResponse({ description: 'Produtor não encontrado' }),
  );
}
