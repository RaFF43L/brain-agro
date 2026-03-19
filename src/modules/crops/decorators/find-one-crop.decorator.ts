import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';

export function FindOneCropDocs() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Buscar uma cultura pelo ID' }),
    ApiParam({ name: 'id', type: Number, description: 'ID da cultura' }),
    ApiOkResponse({ description: 'Cultura encontrada' }),
    ApiNotFoundResponse({ description: 'Cultura não encontrada' }),
  );
}
