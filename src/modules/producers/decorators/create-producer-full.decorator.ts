import { applyDecorators } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiBadRequestResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

export function CreateProducerFullDocs() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Criar produtor com fazendas e culturas em cascata',
    }),
    ApiCreatedResponse({
      description: 'Produtor criado com fazendas e culturas associadas',
    }),
    ApiBadRequestResponse({ description: 'Dados inválidos' }),
  );
}
