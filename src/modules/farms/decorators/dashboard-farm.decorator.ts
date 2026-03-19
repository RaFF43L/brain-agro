import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';

export function DashboardFarmDocs() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Obter dados para dashboard de fazendas' }),
    ApiOkResponse({
      description: 'Dados do dashboard de fazendas',
      schema: {
        type: 'object',
        properties: {
          totals: {
            type: 'object',
            properties: {
              totalFarms: { type: 'number' },
              totalHectares: { type: 'number' },
            },
          },
          byState: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                state: { type: 'string' },
                total: { type: 'number' },
              },
            },
          },
          byCulture: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                culture: { type: 'string' },
                total: { type: 'number' },
              },
            },
          },
          landUse: {
            type: 'object',
            properties: {
              arableArea: { type: 'number' },
              vegetationArea: { type: 'number' },
            },
          },
        },
      },
    }),
  );
}
