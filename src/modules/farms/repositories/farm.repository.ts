import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Farm } from '../entities/farm.entity';
import { CursorPaginationQueryDto, PaginatedResult } from '../../../common/dto/pagination-query.dto';
import { cursorPaginate } from '../../../common/pagination/cursor-paginate';
import { FilterConfig } from '../../../common/interfaces/filter-config.interface';
import { FarmFilterQuery } from '../types/farm-type-query';
import { FilterDateDto } from '../dto/filter-farm.dto';

@Injectable()
export class FarmRepository {
  private readonly sortableFields = ['id', 'name', 'city', 'state', 'totalArea', 'createdAt'];

  constructor(
    @InjectRepository(Farm)
    private readonly repo: Repository<Farm>,
  ) {}

  async findByProducer(
    producerId: number,
    query: CursorPaginationQueryDto,
  ): Promise<PaginatedResult<Farm>> {
    const { page = 1, limit = 10, cursor, search, sortBy, sortOrder = 'ASC' } = query;

    const field = this.sortableFields.includes(sortBy ?? '') ? sortBy! : 'id';

    const qb = this.repo
      .createQueryBuilder('farm')
      .leftJoinAndSelect('farm.crops', 'crop')
      .where('farm.producerId = :producerId', { producerId })
      .orderBy(`farm.${field}`, sortOrder);

    if (search) {
      qb.andWhere('(farm.name ILIKE :search OR farm.city ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    return cursorPaginate(qb, page, limit, cursor);
  }

  async findUnassigned(query: CursorPaginationQueryDto): Promise<PaginatedResult<Farm>> {
    const { page = 1, limit = 10, cursor, search, sortBy, sortOrder = 'ASC' } = query;

    const field = this.sortableFields.includes(sortBy ?? '') ? sortBy! : 'id';

    const qb = this.repo
      .createQueryBuilder('farm')
      .leftJoinAndSelect('farm.crops', 'crop')
      .where('farm.producerId IS NULL')
      .orderBy(`farm.${field}`, sortOrder);

    if (search) {
      qb.andWhere('(farm.name ILIKE :search OR farm.city ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    return cursorPaginate(qb, page, limit, cursor);
  }

  async getDashboard({ initialDate, finalDate }: FilterDateDto) {
    const applyDateFilter = (qb: any) => {
      if (initialDate && finalDate) {
        const start = initialDate.toISOString().split('T')[0];
        const end = finalDate.toISOString().split('T')[0];
        qb.andWhere('farm."createdAt"::date BETWEEN :start AND :end', { start, end });
      }
      return qb;
    };

    const [totals, byState, byCulture, byLandUse] = await Promise.all([
      applyDateFilter(
        this.repo
          .createQueryBuilder('farm')
          .select('COUNT(farm.id)', 'totalFarms')
          .addSelect('SUM(farm.totalArea)', 'totalHectares'),
      ).getRawOne(),

      applyDateFilter(
        this.repo
          .createQueryBuilder('farm')
          .select('farm.state', 'state')
          .addSelect('COUNT(farm.id)', 'total')
          .groupBy('farm.state')
          .orderBy('total', 'DESC'),
      ).getRawMany(),

      applyDateFilter(
        this.repo
          .createQueryBuilder('farm')
          .innerJoin('farm.crops', 'crop')
          .select('crop.culture', 'culture')
          .addSelect('COUNT(crop.id)', 'total')
          .groupBy('crop.culture')
          .orderBy('total', 'DESC'),
      ).getRawMany(),

      applyDateFilter(
        this.repo
          .createQueryBuilder('farm')
          .select('SUM(farm.arableArea)', 'totalArableArea')
          .addSelect('SUM(farm.vegetationArea)', 'totalVegetationArea'),
      ).getRawOne(),
    ]);

    return {
      totalFarms: Number(totals?.totalFarms || 0),
      totalHectares: Number(totals?.totalHectares || 0),
      byState,
      byCulture,
      landUse: {
        arableArea: Number(byLandUse?.totalArableArea || 0),
        vegetationArea: Number(byLandUse?.totalVegetationArea || 0),
      },
    };
  }

  async findOne(id: number): Promise<Farm | null> {
    return this.repo.findOne({ where: { id }, relations: ['producer', 'crops'] });
  }

  async save(farm: Farm): Promise<Farm> {
    return this.repo.save(farm);
  }

  async remove(farm: Farm): Promise<void> {
    await this.repo.remove(farm);
  }

  applyFilters(qb: SelectQueryBuilder<Farm>, query: FarmFilterQuery): void {
    const filterMap: Record<string, FilterConfig> = {
      name: {
        condition: 'farm.name ILIKE :name',
        getValue: (name) => ({ name: `%${name}%` }),
      },
      city: {
        condition: 'farm.city ILIKE :city',
        getValue: (city) => ({ city: `%${city}%` }),
      },
      state: {
        condition: 'farm.state ILIKE :state',
        getValue: (state) => ({ state: `%${state}%` }),
      },
      totalAreaMin: {
        condition: 'farm.totalArea >= :min',
        getValue: (min) => ({ min }),
        shouldApply: (min) => min !== undefined,
      },
      totalAreaMax: {
        condition: 'farm.totalArea <= :max',
        getValue: (max) => ({ max }),
        shouldApply: (max) => max !== undefined,
      },
      producerId: {
        condition: 'farm.producerId = :producerId',
        getValue: (producerId) => ({ producerId }),
        shouldApply: (producerId) => producerId !== undefined,
      },
    };

    for (const [key, config] of Object.entries(filterMap)) {
      const value = query[key as keyof FarmFilterQuery];
      const shouldApply = config.shouldApply ? config.shouldApply(value) : !!value;
      if (shouldApply) {
        qb.andWhere(config.condition, config.getValue(value));
      }
    }
  }
}
