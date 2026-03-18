import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';

export function FindAllCropsDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Listar culturas de uma fazenda' }),
    ApiParam({ name: 'farmId', type: Number, description: 'ID da fazenda' }),
    ApiOkResponse({ description: 'Lista de culturas retornada com sucesso' }),
  );
}
