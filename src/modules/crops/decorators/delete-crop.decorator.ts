import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';

export function DeleteCropDocs() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Remover uma cultura' }),
    ApiParam({ name: 'id', type: Number, description: 'ID da cultura' }),
    ApiNoContentResponse({ description: 'Cultura removida com sucesso' }),
    ApiNotFoundResponse({ description: 'Cultura não encontrada' }),
  );
}
