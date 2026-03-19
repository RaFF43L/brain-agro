import { applyDecorators } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';

export function FindUnassignedCropDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Buscar uma cultura não atribuída pelo ID' }),
    ApiParam({ name: 'id', type: Number, description: 'ID da cultura' }),
    ApiOkResponse({ description: 'Cultura não atribuída encontrada' }),
    ApiNotFoundResponse({ description: 'Cultura não atribuída não encontrada' }),
  );
}
