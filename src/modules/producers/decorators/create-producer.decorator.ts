import { applyDecorators } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

export function CreateProducerDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Criar um novo produtor' }),
    ApiCreatedResponse({ description: 'Produtor criado com sucesso' }),
    ApiBadRequestResponse({ description: 'Dados inválidos' }),
  );
}
