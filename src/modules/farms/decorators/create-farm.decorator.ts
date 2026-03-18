import { applyDecorators } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiBadRequestResponse, ApiNotFoundResponse } from '@nestjs/swagger';

export function CreateFarmDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Criar uma nova fazenda' }),
    ApiCreatedResponse({ description: 'Fazenda criada com sucesso' }),
    ApiBadRequestResponse({ description: 'Dados inválidos' }),
    ApiNotFoundResponse({ description: 'Produtor não encontrado' }),
  );
}
