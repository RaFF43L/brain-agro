import { applyDecorators } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

export function CreateFarmDocs() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Criar uma nova fazenda' }),
    ApiCreatedResponse({ description: 'Fazenda criada com sucesso' }),
    ApiBadRequestResponse({ description: 'Dados inválidos' }),
    ApiNotFoundResponse({ description: 'Produtor não encontrado' }),
  );
}
