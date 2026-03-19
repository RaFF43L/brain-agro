import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';

export function DeleteProducerDocs() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Remover um produtor' }),
    ApiParam({ name: 'id', type: Number, description: 'ID do produtor' }),
    ApiNoContentResponse({ description: 'Produtor removido com sucesso' }),
    ApiNotFoundResponse({ description: 'Produtor não encontrado' }),
  );
}
