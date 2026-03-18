import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';

export function UpdateCropDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Atualizar uma cultura' }),
    ApiParam({ name: 'id', type: Number, description: 'ID da cultura' }),
    ApiOkResponse({ description: 'Cultura atualizada com sucesso' }),
    ApiNotFoundResponse({ description: 'Cultura não encontrada' }),
    ApiBadRequestResponse({ description: 'Dados inválidos' }),
  );
}
