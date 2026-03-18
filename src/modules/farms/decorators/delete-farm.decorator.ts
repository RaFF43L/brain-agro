import { applyDecorators } from '@nestjs/common';
import { ApiNoContentResponse, ApiNotFoundResponse, ApiOperation, ApiParam } from '@nestjs/swagger';

export function DeleteFarmDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Remover uma fazenda' }),
    ApiParam({ name: 'id', type: Number, description: 'ID da fazenda' }),
    ApiNoContentResponse({ description: 'Fazenda removida com sucesso' }),
    ApiNotFoundResponse({ description: 'Fazenda não encontrada' }),
  );
}
