import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';

export function FindAllFarmsDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Listar fazendas de um produtor' }),
    ApiParam({ name: 'producerId', type: Number, description: 'ID do produtor' }),
    ApiOkResponse({ description: 'Lista de fazendas retornada com sucesso' }),
  );
}
