import { SelectQueryBuilder } from 'typeorm';
import { PaginatedResult } from '../dto/pagination-query.dto';

export async function offsetPaginate<T>(
  qb: SelectQueryBuilder<any>,
  page: number,
  limit: number,
): Promise<PaginatedResult<T>> {
  qb.skip((page - 1) * limit).take(limit);

  const [data, total] = await qb.getManyAndCount();
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: { total, page, limit, totalPages, hasNext: page < totalPages },
  };
}
