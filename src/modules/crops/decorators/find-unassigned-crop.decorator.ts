import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';

export function FindUnassignedCropDocs() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Buscar uma cultura não atribuída pelo ID' }),
    ApiOkResponse({ description: 'Cultura não atribuída encontrada' }),
    ApiNotFoundResponse({
      description: 'Cultura não atribuída não encontrada',
    }),
  );
}
