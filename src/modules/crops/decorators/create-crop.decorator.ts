import { applyDecorators } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

export function CreateCropDocs() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Criar uma nova cultura' }),
    ApiCreatedResponse({ description: 'Cultura criada com sucesso' }),
    ApiBadRequestResponse({ description: 'Dados inválidos' }),
    ApiNotFoundResponse({ description: 'Fazenda não encontrada' }),
  );
}
