import { applyDecorators } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiBadRequestResponse, ApiNotFoundResponse } from '@nestjs/swagger';

export function CreateCropDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Criar uma nova cultura' }),
    ApiCreatedResponse({ description: 'Cultura criada com sucesso' }),
    ApiBadRequestResponse({ description: 'Dados inválidos' }),
    ApiNotFoundResponse({ description: 'Fazenda não encontrada' }),
  );
}
