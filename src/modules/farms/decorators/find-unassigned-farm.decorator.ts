import { applyDecorators } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';

export function FindUnassignedFarmDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Buscar fazendas não atribuídas' }),
    ApiOkResponse({ description: 'Fazendas não atribuídas encontradas' }),
    ApiNotFoundResponse({ description: 'Nenhuma fazenda não atribuída encontrada' }),
  );
}
