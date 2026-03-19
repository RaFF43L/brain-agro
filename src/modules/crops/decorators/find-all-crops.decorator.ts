import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';

export function FindAllCropsDocs() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Listar culturas de uma fazenda' }),
    ApiParam({ name: 'farmId', type: Number, description: 'ID da fazenda' }),
    ApiOkResponse({ description: 'Lista de culturas retornada com sucesso' }),
  );
}
