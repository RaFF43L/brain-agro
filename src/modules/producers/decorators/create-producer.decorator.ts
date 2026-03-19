import { applyDecorators } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiBadRequestResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

export function CreateProducerDocs() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Criar um novo produtor' }),
    ApiCreatedResponse({ description: 'Produtor criado com sucesso' }),
    ApiBadRequestResponse({ description: 'Dados inválidos' }),
  );
}
