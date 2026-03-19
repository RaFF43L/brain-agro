import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Crop } from '../entities/crop.entity';
import { CursorPaginationQueryDto, PaginatedResult } from '../../../common/dto/pagination-query.dto';
import { cursorPaginate } from '../../../common/pagination/cursor-paginate';

@Injectable()
export class CropRepository {
  private readonly sortableFields = ['id', 'season', 'culture', 'createdAt'];

  constructor(
    @InjectRepository(Crop)
    private readonly repo: Repository<Crop>,
  ) {}

  async findByFarm(farmId: number, query: CursorPaginationQueryDto): Promise<PaginatedResult<Crop>> {
    const { page = 1, limit = 10, cursor, search, sortBy, sortOrder = 'ASC' } = query;

    const field = this.sortableFields.includes(sortBy ?? '') ? sortBy! : 'id';

    const qb = this.repo
      .createQueryBuilder('crop')
      .where('crop.farmId = :farmId', { farmId })
      .orderBy(`crop.${field}`, sortOrder);

    if (search) {
      qb.andWhere('(crop.season ILIKE :search OR crop.culture ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    return cursorPaginate(qb, page, limit, cursor);
  }

  async findUnassigned(query: CursorPaginationQueryDto): Promise<PaginatedResult<Crop>> {
    const { page = 1, limit = 10, cursor, search, sortBy, sortOrder = 'ASC' } = query;

    const field = this.sortableFields.includes(sortBy ?? '') ? sortBy! : 'id';

    const qb = this.repo
      .createQueryBuilder('crop')
      .where('crop.farmId IS NULL')
      .orderBy(`crop.${field}`, sortOrder);

    if (search) {
      qb.andWhere('(crop.season ILIKE :search OR crop.culture ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    return cursorPaginate(qb, page, limit, cursor);
  }

  async findOne(id: number): Promise<Crop | null> {
    return this.repo.findOne({ where: { id }, relations: ['farm'] });
  }

  async save(crop: Crop): Promise<Crop> {
    return this.repo.save(crop);
  }

  async remove(crop: Crop): Promise<void> {
    await this.repo.remove(crop);
  }
}
