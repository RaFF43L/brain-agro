import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';

export function UpdateProducerDocs() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Atualizar um produtor' }),
    ApiParam({ name: 'id', type: Number, description: 'ID do produtor' }),
    ApiOkResponse({ description: 'Produtor atualizado com sucesso' }),
    ApiNotFoundResponse({ description: 'Produtor não encontrado' }),
    ApiBadRequestResponse({ description: 'Dados inválidos' }),
  );
}
