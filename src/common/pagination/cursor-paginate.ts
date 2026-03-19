import { SelectQueryBuilder } from 'typeorm';
import { PaginatedResult } from '../dto/pagination-query.dto';

export async function cursorPaginate<T extends { id: number }>(
  qb: SelectQueryBuilder<T>,
  page: number,
  limit: number,
  cursor?: number,
): Promise<PaginatedResult<T>> {
  if (cursor) {
    qb.andWhere(`${qb.alias}.id > :cursor`, { cursor });
  }

  qb.take(limit);

  if (!cursor) {
    qb.skip((page - 1) * limit);
  }

  const [data, total] = await qb.getManyAndCount();
  const totalPages = Math.ceil(total / limit);
  const lastItem = data[data.length - 1];

  return {
    data,
    meta: {
      total,
      page: cursor ? 0 : page,
      limit,
      totalPages,
      hasNext: cursor ? data.length === limit : page < totalPages,
      nextCursor: lastItem?.id ?? null,
    },
  };
}
