import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';

export function FindOneFarmDocs() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Buscar uma fazenda pelo ID' }),
    ApiParam({ name: 'id', type: Number, description: 'ID da fazenda' }),
    ApiOkResponse({ description: 'Fazenda encontrada' }),
    ApiNotFoundResponse({ description: 'Fazenda não encontrada' }),
  );
}
