import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Farm } from './entities/farm.entity';
import { ProducersService } from '../producers/producers.service';
import { HandleErrorsClass } from '../../common/decorators/handle-errors-class.decorator';
import { CustomError } from '../../common/errors/custom-error';
import {
  CursorPaginationQueryDto,
  PaginatedResult,
} from '../../common/dto/pagination-query.dto';
import { FilterConfig } from '../../common/interfaces/filter-config.interface';
import { FarmFilterQuery } from './types/farm-type-query';
import { FilterDateDto } from './dto/filter-farm.dto';
@Injectable()
@HandleErrorsClass({ rethrow: true })
export class FarmsService {
  private readonly sortableFields = [
    'id',
    'name',
    'city',
    'state',
    'totalArea',
    'createdAt',
  ];

  constructor(
    @InjectPinoLogger(FarmsService.name)
    private readonly logger: PinoLogger,
    @InjectRepository(Farm)
    private readonly farmRepository: Repository<Farm>,
    private readonly producersService: ProducersService,
  ) {}

  async create(dto: {
    name: string;
    city: string;
    state: string;
    totalArea: number;
    arableArea: number;
    vegetationArea: number;
    producerId: number;
  }): Promise<Farm> {
    await this.producersService.findOne(dto.producerId);

    if (dto.arableArea + dto.vegetationArea > dto.totalArea) {
      throw new CustomError(
        'A soma das áreas agricultável e de vegetação não pode ultrapassar a área total da fazenda',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const farm = Object.assign(new Farm(), dto);
    return this.farmRepository.save(farm);
  }

  async findByProducer(
    producerId: number,
    query: CursorPaginationQueryDto,
  ): Promise<PaginatedResult<Farm>> {
    const {
      page = 1,
      limit = 10,
      cursor,
      search,
      sortBy,
      sortOrder = 'ASC',
    } = query;

    const field = this.sortableFields.includes(sortBy ?? '') ? sortBy! : 'id';

    const qb = this.farmRepository
      .createQueryBuilder('farm')
      .leftJoinAndSelect('farm.crops', 'crop')
      .where('farm.producerId = :producerId', { producerId })
      .orderBy(`farm.${field}`, sortOrder);

    this.applyFilters(qb, { name: search, city: search, state: search });

    if (search) {
      qb.andWhere('(farm.name ILIKE :search OR farm.city ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    if (cursor) {
      qb.andWhere('farm.id > :cursor', { cursor });
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

  async findUnassigned(
    query: CursorPaginationQueryDto,
  ): Promise<PaginatedResult<Farm>> {
    const {
      page = 1,
      limit = 10,
      cursor,
      search,
      sortBy,
      sortOrder = 'ASC',
    } = query;

    const field = this.sortableFields.includes(sortBy ?? '') ? sortBy! : 'id';

    const qb = this.farmRepository
      .createQueryBuilder('farm')
      .leftJoinAndSelect('farm.crops', 'crop')
      .where('farm.producerId IS NULL')
      .orderBy(`farm.${field}`, sortOrder);

    this.applyFilters(qb, { name: search, city: search, state: search });

    if (search) {
      qb.andWhere('(farm.name ILIKE :search OR farm.city ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    if (cursor) {
      qb.andWhere('farm.id > :cursor', { cursor });
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

  async getDashboard({ initialDate, finalDate }: FilterDateDto) {
    const applyDateFilter = (qb: any) => {
      if (initialDate && finalDate) {
        const start = initialDate.toISOString().split('T')[0];
        const end = finalDate.toISOString().split('T')[0];

        qb.andWhere('farm."createdAt"::date BETWEEN :start AND :end', {
          start,
          end,
        });
      }
      return qb;
    };
    const [totals, byState, byCulture, byLandUse] = await Promise.all([
      applyDateFilter(
        this.farmRepository
          .createQueryBuilder('farm')
          .select('COUNT(farm.id)', 'totalFarms')
          .addSelect('SUM(farm.totalArea)', 'totalHectares'),
      ).getRawOne(),

      applyDateFilter(
        this.farmRepository
          .createQueryBuilder('farm')
          .select('farm.state', 'state')
          .addSelect('COUNT(farm.id)', 'total')
          .groupBy('farm.state')
          .orderBy('total', 'DESC'),
      ).getRawMany(),

      applyDateFilter(
        this.farmRepository
          .createQueryBuilder('farm')
          .innerJoin('farm.crops', 'crop')
          .select('crop.culture', 'culture')
          .addSelect('COUNT(crop.id)', 'total')
          .groupBy('crop.culture')
          .orderBy('total', 'DESC'),
      ).getRawMany(),

      applyDateFilter(
        this.farmRepository
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

  async update(
    id: number,
    dto: Partial<{
      name: string;
      city: string;
      state: string;
      totalArea: number;
      arableArea: number;
      vegetationArea: number;
    }>,
  ): Promise<Farm> {
    const farm = await this.findOne(id);

    const totalArea = dto.totalArea ?? farm.totalArea;
    const arableArea = dto.arableArea ?? farm.arableArea;
    const vegetationArea = dto.vegetationArea ?? farm.vegetationArea;

    if (arableArea + vegetationArea > totalArea) {
      throw new CustomError(
        'A soma das áreas agricultável e de vegetação não pode ultrapassar a área total da fazenda',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    Object.assign(farm, dto);
    return this.farmRepository.save(farm);
  }

  async remove(id: number): Promise<void> {
    const farm = await this.findOne(id);
    await this.farmRepository.remove(farm);
  }

  async findOne(id: number): Promise<Farm> {
    const farm = await this.farmRepository.findOne({
      where: { id },
      relations: ['producer', 'crops'],
    });

    if (!farm) {
      throw new CustomError(
        `Farm with id ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return farm;
  }

  private buildFilterMap(): Record<string, FilterConfig> {
    return {
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
  }

  private applyFilters(
    qb: SelectQueryBuilder<Farm>,
    query: FarmFilterQuery,
  ): void {
    const filterMap = this.buildFilterMap();

    for (const [key, config] of Object.entries(filterMap)) {
      const value = query[key as keyof FarmFilterQuery];
      const shouldApply = config.shouldApply
        ? config.shouldApply(value)
        : !!value;

      if (shouldApply) {
        qb.andWhere(config.condition, config.getValue(value));
      }
    }
  }
}
