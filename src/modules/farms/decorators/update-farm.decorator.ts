import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

export function UpdateFarmDocs() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Atualizar uma fazenda' }),
    ApiParam({ name: 'id', type: Number, description: 'ID da fazenda' }),
    ApiOkResponse({ description: 'Fazenda atualizada com sucesso' }),
    ApiNotFoundResponse({ description: 'Fazenda não encontrada' }),
    ApiBadRequestResponse({ description: 'Dados inválidos' }),
    ApiUnprocessableEntityResponse({
      description: 'Soma das áreas ultrapassa a área total',
    }),
  );
}
